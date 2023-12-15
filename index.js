const express = require('express');
const app = express();

const axios = require('axios');
const ical2json = require('ical2json');
const url = require('url');

const { performance } = require("perf_hooks");

async function filter(req, res, predicate) {
    try {
        var query = url.parse(req.url).query;
        var ical = ical2json.convert((await axios.get(`https://www.fer.unizg.hr/_download/calevent/mycal.ics?${query}`)).data);
        var ferko = ical2json.convert((await axios.get(`http://ferko.fer.hr/ferko/ical/ICalUser.action?${query}`)).data);
        if (ferko.VCALENDAR !== undefined) ical.VCALENDAR[0].VEVENT.push(...ferko.VCALENDAR[0].VEVENT);
        let events = [];
        for (var i of ical.VCALENDAR[0].VEVENT) {
            if (predicate(i)) {
                events.push(i);
            }
        }
        ical.VCALENDAR[0].VEVENT = events;
        res.setHeader('Content-Disposition', 'attachment; filename="mycal.ics"');
        res.setHeader('Content-Type', 'text/calendar');
        var ret = ical2json.revert(ical);
        res.send(ret);

    } catch (e) {
        console.error(e);
        res.sendStatus(500);
    }
}

// Ispit detector helper
const ispit = ["završni", "pismeni", "ispit", "međuispit"];

// Main filter of completely unwanted events (inzdok)
function mainFilter(i) {
    if (i.SUMMARY.includes("Inženjersko dokumentiranje")) {
        return ispit.some(j => i.SUMMARY.toLowerCase().includes(j));
    }
    return true;
}

// What's important? Sve osim predavanja :b1:
function condition(i) {
    return !i.SUMMARY.includes('predavanje');
}

app.use((req, res, next) => {
    let info = [
        new Date(Date.now()).toISOString(),
        req.headers['x-forwarded-for'] || req.socket.remoteAddress,
        req.headers['user-agent'],
        req.query.user,
        req.method,
        req._parsedUrl.pathname
    ];

    console.log(info.filter(i => i).join('\t'));

    let start = performance.now();

    res.on('finish', () => {
        let info = [
            res.statusCode,
            res.get('Content-Type'),
            res.get('Content-Length'),
            (performance.now() - start).toFixed(2)
        ];

        console.log('\t' + info.filter(i => i).join('\t'));
    })

    next();
});

app.get('/api/predavanja', async (req, res) => filter(req, res, i => mainFilter(i) && !condition(i)));
app.get('/api/ostalo', async (req, res) => filter(req, res, i => mainFilter(i) && condition(i)));

module.exports = app;
app.listen(process.env.PORT || 3456);
