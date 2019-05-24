require('dotenv').config()

const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();

const asyncHandler = require('express-async-handler');

var aws = require('aws-sdk');

var bs58 = require('bs58');
var nanoid = require('nanoid');
var crypto = require("crypto-js");

var axios = require('axios');

var morpheneJS = require('@boone-development/morphene-js');

aws.config.update({
  accessKeyId: process.env["AWS_ACCESS_KEY_ID"],
  secretAccessKey: process.env["AWS_ACCESS_KEY_SECRET"],
  region: 'us-east-1'
});

function sendEmail(to, subject, body) {
    var ses = new aws.SES();
    var eParams = {
        Destination: {
            ToAddresses: [to]
        },
        Message: {
            Body: {
                Text: {
                    Data: body
                }
            },
            Subject: {
                Data: subject
            }
        },

        Source: process.env["SEND_TO_EMAIL"]
    };

    ses.sendEmail(eParams, function(error, data){ if(error) console.log(error); });
};

app.use(bodyParser.json());

app.post('/createAccount', asyncHandler(async (httpReq, httpRes, httpNext) => {
    const { userPoolId, userAccessToken } = httpReq.body;
    if( !userPoolId, !userAccessToken ) {
        httpRes.status(500).send({error: "userPoolId or userAccessToken are missing or invalid."});
        return;
    }

    new Promise(function(resolve, reject) {
        const cognitoIdServiceProvider = new aws.CognitoIdentityServiceProvider({region: 'us-east-1'});
        cognitoIdServiceProvider.getUser({AccessToken: userAccessToken}, (error, data) => {
            if (error) {
                throw new Error(JSON.stringify(error));
            } else {
                resolve({userPoolId, userAccessToken, user: data});
            }
        })
    })
    .then((params) => {
        var userName, activeKey, chainName;

        const userPoolId = params.userPoolId;
        userName = params.user.Username;
        const userEmail = params.user.UserAttributes.find((obj)=>{return obj.Name === "email"}).Value;
        activeKey = params.user.UserAttributes.find((obj)=>{return obj.Name === "custom:activeKey"});
        chainName = params.user.UserAttributes.find((obj)=>{return obj.Name === "custom:chainName"});

        if(activeKey && chainName) {
            throw new Error(`User: ${userEmail} already has a chain account (${chainName.Value}).`);
        } else {
            chainName = `m${morpheneJS.formatter.createSuggestedPassword()}`.slice(0,16).toLowerCase();
            const newPassword = morpheneJS.formatter.createSuggestedPassword();
            const keys = morpheneJS.auth.generateKeys(chainName, newPassword, ["owner","active","posting","memo"]);
            activeKey = morpheneJS.auth.getPrivateKeys(chainName, newPassword, ["active"]).active;

            const wif = process.env["MORPHENE_CREATOR_WIF"];
            const creator = process.env["MORPHENE_CREATOR_NAME"];

            const fee = process.env["MORPHENE_CREATOR_FEE"];
            const owner = {"key_auths":[[keys.owner, 1]],"account_auths":[],"weight_threshold":1};
            const active = {"key_auths":[[keys.active, 1]],"account_auths":[],"weight_threshold":1};
            const posting = {"key_auths":[[keys.posting, 1]],"account_auths":[],"weight_threshold":1};
            const memoKey = keys.memo;

            morpheneJS.broadcast.accountCreate(wif, fee, creator, chainName, owner, active, posting, memoKey, '{}',
            (err, result) => {
                if (err) { throw new Error(JSON.stringify(err)); }
            })

            return {userPoolId, userName, userEmail, activeKey, chainName, wif, creator};
        }
    })
    .then((params) => {
        const { userPoolId, userName, userEmail, activeKey, chainName, wif, creator } = params;
        const shared_secret = process.env["SHARED_SECRET"];
        var encryptedPassword = crypto.AES.encrypt("newPassword", shared_secret).toString();
        // var decryptedPassword = crypto.AES.decrypt(encryptedPassword, shared_secret).toString(crypto.enc.Utf8);

        var userParams =  {
            UserAttributes: [
                {
                    Name: 'custom:activeKey',
                    Value: activeKey
                },
                {
                    Name: 'custom:chainName',
                    Value: chainName
                },
                {
                    Name: 'custom:encryptedPassword',
                    Value: encryptedPassword
                }
            ],
            UserPoolId: userPoolId,
            Username: userName
        }

        const cognitoIdServiceProvider = new aws.CognitoIdentityServiceProvider({region: 'us-east-1'});
        cognitoIdServiceProvider.adminUpdateUserAttributes(userParams, function(error, data) {
            if (error) {
                var emailBody = `Unable to update ${userEmail} attributes:\n\n\n`;
                emailBody += `Error: ${error}`;
                sendEmail(process.env["SEND_TO_EMAIL"],
                    "Morphene CIP Registration Failure",
                    emailBody);
                throw new Error(JSON.stringify(error));
            }
        })

        return {wif, creator, chainName, userEmail, userName}
    })
    .then((params) => {
        const { wif, creator, chainName, userEmail, userName } = params;
        morpheneJS.broadcast.transferAsync(wif, creator, chainName, "1000.000 MORPH", "")
        .then((res) => {
            var emailBody = `${userEmail} has just signed up:\n\n\n`;
            emailBody += `CIP ID: ${userName}\n`;
            emailBody += `ChainName: ${chainName}\n`;
            emailBody += `Email: ${userEmail}\n`;
            emailBody += `Funded: true\n`;
            sendEmail(process.env["SEND_TO_EMAIL"],
                "Morphene CIP Registration Success",
                emailBody);
            return;
        })
        .catch((error) => {
            var emailBody = `${userEmail} has just signed up:\n\n\n`;
            emailBody += `CIP ID: ${userName}\n`;
            emailBody += `ChainName: ${chainName}\n`;
            emailBody += `Email: ${userEmail}\n`;
            emailBody += `Funded: false\n`;
            sendEmail(process.env["SEND_TO_EMAIL"],
                "Morphene CIP Registration Success",
                emailBody);
            return;
        })
    })
    .then(() => {
        httpRes.status(200).send({success: true});
        return;
    })
    .catch((error) => {
        var emailBody = `Error while creating chain account subscriber.\n\n\n\n`;
        emailBody += `${error}`;
        sendEmail(process.env["SEND_TO_EMAIL"], "Morphene CIP Registration Failure", emailBody);
        httpRes.status(500).send(error);
    })
}));

if (process.env["NODE_ENV"] === "production") {
    app.use('/static', express.static("build"));
} else {
    app.use('/', express.static("build"));
}

app.get("*", (req, res) => {
    res.sendFile(path.resolve(__dirname, "build", "index.html"));
});

app.listen(3000);

