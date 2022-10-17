const express = require('express');
const app = express();

const axios = require('axios');
const ical2json = require('ical2json');
const url = require('url');

async function filter(req, res, predicate) {
    var ical = ical2json.convert((await axios.get(`https://www.fer.unizg.hr/_download/calevent/mycal.ics?${url.parse(req.url).query}`)).data);
    let events = [];
    for (var i of ical.VCALENDAR[0].VEVENT) {
        if (predicate(i)) {
            events.push(i);
        }
    }
    ical.VCALENDAR[0].VEVENT = events;
    res.setHeader('Content-Disposition', 'attachment; filename="mycal.ics"');
    res.setHeader('Content-Type', 'text/calendar');
    res.send(ical2json.revert(ical));
}

function condition(i) {
    return !i.SUMMARY.includes('predavanje') ||
        i.UID.includes("c5a8eb90c965f158afaef0647e6020ed@www.fer.unizg.hr"); // inzenjersko dokumentiranje prvo predavanje
}

app.get('/api/predavanja', async (req, res) => filter(req, res, i => !condition(i)));
app.get('/api/ostalo', async (req, res) => filter(req, res, condition));

module.exports = app;
//app.listen(3000);
