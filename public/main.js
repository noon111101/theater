mapboxgl.accessToken =
  'pk.eyJ1IjoiYnRsMDAxIiwiYSI6ImNrdGJuNGRqMzF4OWgydnI1c3c3Y25nZ3UifQ.kOzRfmTBUEHwX2-447KoaQ';
const map = new mapboxgl.Map({
  container: 'map',
  style: 'mapbox://styles/mapbox/dark-v10',
  center: [-103.5917, 40.6699],
  zoom: 3,
});

const apiUrl = 'http://101.96.66.219:8005/api/theater/geojson';
// const apiUrl = 'http://localhost:8005/api/theater/geojson';
const entityMap = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '(': '&#40',
  ')': '&#41',
  '"': '&quot;',
  "'": '&#39;',
  '/': '&#x2F;',
  '`': '&#x60;',
  '=': '&#x3D;',
  ';': '&#59',
};
function escapeHtml(string) {
  return String(string).replace(/[&<>()"'`;=\/]/g, function (s) {
    return entityMap[s];
  });
}

let table;
$(document).ready(function () {
  table = $('#table').DataTable({
    columnDefs: [
      {
        targets: [0],
        // visible: false,
        className: 'hide',
        searchable: false,
        sortable: false,
      },
    ],
    ajax: {
      url: apiUrl,
      dataSrc: 'features',
    },
    columns: [
      { data: '_id', render: escapeHtml },
      { data: 'geometry.coordinates.0', render: escapeHtml },
      { data: 'geometry.coordinates.1', render: escapeHtml },
      { data: 'properties.address.street1', render: escapeHtml },
      { data: 'properties.address.city', render: escapeHtml },
      { data: 'properties.address.state', render: escapeHtml },
      { data: 'properties.address.zipcode', render: escapeHtml },
      {
        data: null,
        searchable: false,
        sortable: false,
        mRender: function () {
          return '<button class="btn btn-primary btn-sm" onclick="fillUpdateForm(this)">Edit</button>';
        },
      },
      {
        data: null,
        searchable: false,
        sortable: false,
        mRender: function () {
          return '<button class="btn btn-danger btn-sm" onclick="deleteLocation(this)">Delete</button>';
        },
      },
    ],
  });

  const mapDiv = $('#map');
  const tableDiv = $('#table-div');
  let isHide = false;
  document.addEventListener('keydown', e => {
    if (e.ctrlKey === true && e.key === 'x') {
      if (isHide) {
        isHide = !isHide;
        mapDiv.css('height', '50%');
        tableDiv.css('display', 'block');
        map.resize();
      } else {
        isHide = !isHide;
        mapDiv.css('height', '100%');
        tableDiv.css('display', 'none');
        map.resize();
      }
    }
  });

  $('#table_length').append(
    '<label id="suggest" for=""><kbd>Ctrl</kbd> + <kbd>X</kbd> to hide/unhidden table</label>'
  );

  $('#table_length').append(
    `<button
    id="show-form"
    type="button"
    class="btn btn-primary btn-sm"
    data-toggle="modal"
    data-target="#formModal"
    >
    Add theater location
    </button>`
  );

  $('#myForm').submit(function (event) {
    event.preventDefault();
    const value = {};
    $.each($('#myForm').serializeArray(), function (i, field) {
      value[field.name] = field.value;
    });
    let url = apiUrl;
    let method = 'POST';
    let message = 'Add location successfully';
    const id = $('#_id').val();
    if (id) {
      url += `/${id}`;
      method = 'PUT';
      message = 'Location change done';
    }
    const { geoX, geoY, street1, city, state, zipcode } = value;
    var settings = {
      url,
      method,
      timeout: 0,
      headers: {
        'Content-Type': 'application/json',
      },
      data: JSON.stringify({
        geometry: {
          type: 'Point',
          coordinates: [parseFloat(geoX), parseFloat(geoY)],
        },
        properties: {
          address: {
            street1,
            city,
            state,
            zipcode,
          },
        },
      }),
    };

    $.ajax(settings).done(function (response) {
      if (response.success) {
        alert(message);
        clearForm();
        $('#closeModal').click();
        updateMap();
        if (method === 'POST') {
          addRow(response.data);
        } else {
          updateRow(response.data);
        }
      } else {
        alert('Something went wrong. Please try again!');
      }
    });
  });

  $('button[data-dismiss="modal"]').click(clearForm);
});

function deleteLocation(item) {
  const row = $(item).closest('tr');
  const id = row.children(':first').text();

  const settings = {
    url: apiUrl + `/${id}`,
    method: 'DELETE',
    timeout: 0,
  };
  $.ajax(settings).done(function (response) {
    console.log(response);
    if (response.success) {
      row.remove();
      updateMap();
    } else {
      alert('Something went wrong');
    }
  });
}

function fillUpdateForm(item) {
  const row = $(item).closest('tr');
  $('#_id').val(row.find('td:nth-child(1)').text());
  $('#geoX').val(row.find('td:nth-child(2)').text());
  $('#geoY').val(row.find('td:nth-child(3)').text());
  $('#street1').val(row.find('td:nth-child(4)').text());
  $('#city').val(row.find('td:nth-child(5)').text());
  $('#state').val(row.find('td:nth-child(6)').text());
  $('#zipcode').val(row.find('td:nth-child(7)').text());
  $('#show-form').click();
}

function clearForm() {
  $('#_id').val('');
  $('#geoX').val('');
  $('#geoY').val('');
  $('#street1').val('');
  $('#city').val('');
  $('#state').val('');
  $('#zipcode').val('');
}

function updateRow(data) {
  const _id = data._id;
  const [geoX, geoY] = data.geometry.coordinates;
  const { street1, city, state, zipcode } = data.properties.address;
  const row = $(`td:contains(${_id})`).closest('tr');
  row.find('td:nth-child(1)').text(_id);
  row.find('td:nth-child(2)').text(geoX);
  row.find('td:nth-child(3)').text(geoY);
  row.find('td:nth-child(4)').text(street1);
  row.find('td:nth-child(5)').text(city);
  row.find('td:nth-child(6)').text(state);
  row.find('td:nth-child(7)').text(zipcode);
}

const oddOrEven = (() => {
  let n = 1;
  return () => {
    n = 1 - n;
    return n;
  };
})();

function addRow(data) {
  const _id = data._id;
  const [geoX, geoY] = data.geometry.coordinates;
  const { street1, city, state, zipcode } = data.properties.address;
  const rowClass = oddOrEven() === 0 ? 'even' : 'odd';
  $('tbody').prepend(`<tr class="${rowClass}">
  <td class="sorting_1 hide">${_id}</td>
  <td>${escapeHtml(geoX)}</td>
  <td>${escapeHtml(geoY)}</td>
  <td>${escapeHtml(street1)}</td>
  <td>${escapeHtml(city)}</td>
  <td>${escapeHtml(state)}</td>
  <td>${escapeHtml(zipcode)}</td>
  <td>
    <button class="btn btn-primary btn-sm" onclick="fillUpdateForm(this)">Edit</button>
  </td>
  <td>
    <button class="btn btn-danger btn-sm" onclick="deleteLocation(this)">
      Delete
    </button>
  </td>
</tr>`);
}

map.on('load', () => {
  // Add a new source from our GeoJSON data and
  // set the 'cluster' option to true. GL-JS will
  // add the point_count property to your source data.
  map.addSource('earthquakes', {
    type: 'geojson',
    // Point to GeoJSON data. This example visualizes all M1.0+ earthquakes
    // from 12/22/15 to 1/21/16 as logged by USGS' Earthquake hazards program.
    data: apiUrl,
    cluster: true,
    clusterMaxZoom: 14, // Max zoom to cluster points on
    clusterRadius: 50, // Radius of each cluster when clustering points (defaults to 50)
  });

  map.addLayer({
    id: 'clusters',
    type: 'circle',
    source: 'earthquakes',
    filter: ['has', 'point_count'],
    paint: {
      // Use step expressions (https://docs.mapbox.com/mapbox-gl-js/style-spec/#expressions-step)
      // with three steps to implement three types of circles:
      //   * Blue, 20px circles when point count is less than 100
      //   * Yellow, 30px circles when point count is between 100 and 750
      //   * Pink, 40px circles when point count is greater than or equal to 750
      'circle-color': [
        'step',
        ['get', 'point_count'],
        '#51bbd6',
        100,
        '#f1f075',
        750,
        '#f28cb1',
      ],
      'circle-radius': ['step', ['get', 'point_count'], 20, 100, 30, 750, 40],
    },
  });

  map.addLayer({
    id: 'cluster-count',
    type: 'symbol',
    source: 'earthquakes',
    filter: ['has', 'point_count'],
    layout: {
      'text-field': '{point_count_abbreviated}',
      'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
      'text-size': 12,
    },
  });

  map.addLayer({
    id: 'unclustered-point',
    type: 'circle',
    source: 'earthquakes',
    filter: ['!', ['has', 'point_count']],
    paint: {
      'circle-color': '#11b4da',
      'circle-radius': 4,
      'circle-stroke-width': 1,
      'circle-stroke-color': '#fff',
    },
  });

  // inspect a cluster on click
  map.on('click', 'clusters', e => {
    const features = map.queryRenderedFeatures(e.point, {
      layers: ['clusters'],
    });
    const clusterId = features[0].properties.cluster_id;
    map
      .getSource('earthquakes')
      .getClusterExpansionZoom(clusterId, (err, zoom) => {
        if (err) return;

        map.easeTo({
          center: features[0].geometry.coordinates,
          zoom: zoom,
        });
      });
  });

  // When a click event occurs on a feature in
  // the unclustered-point layer, open a popup at
  // the location of the feature, with
  // description HTML from its properties.
  map.on('click', 'unclustered-point', e => {
    const coordinates = e.features[0].geometry.coordinates.slice();
    const address = e.features[0].properties.address;
    // Ensure that if the map is zoomed out such that
    // multiple copies of the feature are visible, the
    // popup appears over the copy being pointed to.
    while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
      coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
    }

    new mapboxgl.Popup()
      .setLngLat(coordinates)
      .setHTML(`Address: ${address}`)
      .addTo(map);
  });

  map.on('mouseenter', 'clusters', () => {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', 'clusters', () => {
    map.getCanvas().style.cursor = '';
  });
  map.on('mousemove', e => {
    document.getElementById('info').innerHTML = JSON.stringify(e.lngLat.wrap());
  });
  map.on('moveend', () => {
    const currentBound = map.getBounds();
    const _ne = Object.values(currentBound._ne).toString();
    const _sw = Object.values(currentBound._sw).toString();
    const url = apiUrl + `/box?_ne=${_ne}&_sw=${_sw}`;
    // console.log(url);
    table.ajax.url(url).load();
  });
});

function updateMap() {
  console.log(map.getSource('earthquakes'));
  map.getSource('earthquakes').setData(apiUrl);
}
