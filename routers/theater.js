const express = require('express');
const Theater = require('../models/Theater');

const router = express.Router();

function convertGeo(theater) {
  if (theater.location.address.zipcode === undefined)
    theater.location.address.zipcode = '';
  return {
    type: 'Feature',
    geometry: theater.location.geo,
    properties: { address: theater.location.address },
    _id: theater._id,
  };
}

function revertGeo(location) {
  const coordinates = location.geometry.coordinates;
  const addressProp = location.properties.address;
  if (
    coordinates &&
    coordinates.constructor === Array &&
    coordinates.length == 2 &&
    typeof coordinates[0] === 'number' &&
    typeof coordinates[1] === 'number'
  ) {
    const theater = {
      location: {
        address: { street1: '', city: '', state: '', zipcode: '' },
        geo: { type: 'Point', coordinates: [] },
      },
    };
    theater.location.geo.coordinates = coordinates;
    if (addressProp) {
      theater.location.address = {
        ...theater.location.address,
        ...addressProp,
      };
    }
    return theater;
  } else {
    throw new Error('geometry.coordinates required 2 number');
  }
}

// @route GET api/theater
// @desc get all theater info
// @access Public
router.get('/', async (req, res) => {
  let data = await Theater.find();
  res.json(data);
});

// @route GET api/theater/geojson
// @desc get theater geojson ALL or LIMIT
// @ access Public
router.get('/geojson', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit);
    let data = limit ? await Theater.find().limit(limit) : await Theater.find();
    data = data.map(convertGeo);
    res.json({
      success: true,
      type: 'FeatureCollection',
      features: data,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// @route GET api/theater/geojson/area
// @desc get theater geojson by box area
// @ access Public
router.get('/geojson/box', async (req, res) => {
  try {
    const _ne = req.query._ne.split(',').map(x => parseFloat(x));
    const _sw = req.query._sw.split(',').map(x => parseFloat(x));
    let data = await Theater.find({
      'location.geo': { $geoWithin: { $box: [_ne, _sw] } },
    });
    data = data.map(convertGeo);
    res.json({ success: true, type: 'FeatureCollection', features: data });
  } catch (error) {
    res.json({
      success: false,
      message: error.message,
    });
  }
});

// @route GET api/theater/geojson
// @desc get theater geojson by ID
// @ access Public
router.get('/geojson/:_id', async (req, res) => {
  try {
    let data = await Theater.findById(req.params._id);
    data = convertGeo(data);
    res.json({
      success: true,
      data,
    });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// @route POST api/theater/geojson
// @desc post theater geojson
// @ access Public
router.post('/geojson', async (req, res) => {
  try {
    const theater = revertGeo(req.body);
    let data = await Theater.create(theater);
    data = convertGeo(data);
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// @route PUT api/theater/geojson
// @desc update theater geojson
// @ access Public
router.put('/geojson/:_id', async (req, res) => {
  try {
    const _id = req.params._id;
    const theater = revertGeo(req.body);
    let data = await Theater.findByIdAndUpdate(_id, theater, { new: true });
    data = convertGeo(data);
    res.json({ success: true, data });
  } catch (error) {
    res.json({ success: false, message: error.message });
  }
});

// @route DELETE api/theater/geojson
// @desc delete theater geojson by ID
// @ access Public
router.delete('/geojson/:_id', (req, res) => {
  Theater.findByIdAndDelete(req.params._id, function (err, data) {
    if (err) {
      console.log(err.message);
      res.json({ success: false, message: err.message });
      return;
    }
    data = data === null ? data : convertGeo(data);
    res.json({ success: true, data });
  });
});

module.exports = router;
