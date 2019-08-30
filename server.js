const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const os = require('os');
const open = require('open');

const applicationPort = 3000;
const uploadDirectory = './uploads';

const ifaces = os.networkInterfaces();
const allOSIps = [];

Object.keys(ifaces).forEach(function (ifname) {
    let alias = 0;

    ifaces[ifname].forEach(function (iface) {
        if ('IPv4' !== iface.family || iface.internal !== false) {
            // skip over internal (i.e. 127.0.0.1) and non-ipv4 addresses
            return;
        }

        if (alias >= 1) {
            // this single interface has multiple ipv4 addresses
            allOSIps.push({
                name: `${ifname}; ${alias}`,
                address: iface.address,
            });
        } else {
            // this interface has only one ipv4 adress
            allOSIps.push({
                name: ifname,
                address: iface.address,
            });
        }

        ++alias;
    });
});


if (!fs.existsSync(uploadDirectory)){
    fs.mkdirSync(uploadDirectory);
}

const app = express();
app.set('view engine', 'ejs');

app.use('/static', express.static(path.join(__dirname, uploadDirectory)));

app.get('/', (req, res) => {
    res.render('index', {
        allOSIps,
        applicationPort,
    });
});

const storage = multer.diskStorage({
    destination: function (req, file, callback) {
        callback(null, uploadDirectory);
    },
    filename: function (req, file, callback) {
        callback(null, file.originalname);
    }
});
const upload = multer({storage: storage}).array('files', 12);

app.post('/upload', function (req, res, next) {
    upload(req, res, function (err) {
        if (err) {
            console.error(err);

            return res.render('uploaded', {
                message: "Something went wrong :(",
            });
        }

        return res.render('uploaded', {
            message: "Upload completed.",
        });
    });
});

app.get('/flist', (req, res) => {
    const avaiableFiles = fs.readdirSync(path.join(__dirname, uploadDirectory));

    res.render('flist', {
        avaiableFiles,
    });
});

app.listen(applicationPort, () => {
    console.log('App listening');

    allOSIps.forEach(function (ip) {
        console.log(`${ip.name} - ${ip.address}:${applicationPort}`);
    });

    open(`http://localhost:${applicationPort}`);
});
