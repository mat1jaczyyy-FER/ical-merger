const express = require('express');
const app = express();
const port = 3000;

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

app.get('/predavanja', async (req, res) => filter(req, res, i => i.SUMMARY.includes('predavanje')));
app.get('/ostalo', async (req, res) => filter(req, res, i => !i.SUMMARY.includes('predavanje')));

app.listen(port);