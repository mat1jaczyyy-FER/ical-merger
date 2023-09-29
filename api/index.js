const express = require('express');
const app = express();

const axios = require('axios');
const ical2json = require('ical2json');
const url = require('url');

async function filter(req, res, predicate) {
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
    res.send(ical2json.revert(ical));
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

app.get('/api/predavanja', async (req, res) => filter(req, res, i => mainFilter(i) && !condition(i)));
app.get('/api/ostalo', async (req, res) => filter(req, res, i => mainFilter(i) && condition(i)));

module.exports = app;
//app.listen(3000);
