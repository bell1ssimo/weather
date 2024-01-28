const apiKey = "0a1a615c9f3542e7902fb89dff7966bd";
const apiUrl = "https://api.openweathermap.org/data/2.5/weather?units=metric&q=";

const searchBox = document.querySelector(".search input");
const searchBtn = document.querySelector(".search button");
const weatherIcon = document.querySelector(".weather-icon");

//Leaflet
let map;
function initMap(latitude, longitude) {
  if (map) {
    map.remove();
  }
  //Create map
  map = L.map('map').setView([latitude, longitude], 10);
  //OpenStreetMap layer
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);
  //map marker
  L.marker([latitude, longitude]).addTo(map)
    .bindPopup('Nur-Sultan')
    .openPopup();
  //map movements event listener
  map.on('moveend', function () {
    const center = map.getCenter();
    checkWeatherByCoordinates(center.lat, center.lng);
  });
  checkWeatherByCoordinates(latitude, longitude);
}

initMap(51.1657, 71.4186);

async function getCityCoordinates(city) {
  const cityApiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}`;

  try {
    const response = await fetch(cityApiUrl);

    if (response.ok) {
      const data = await response.json();
      return data.coord;
    } else {
      console.error('Error fetching city coordinates:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('An error occurred while fetching city coordinates:', error);
    return null;
  }
}
////////////////////////////////////////////////////
async function getAirQuality(latitude, longitude) {
  const waqiApiUrl = `https://api.waqi.info/feed/geo:${latitude};${longitude}/?token=dcf13e1f5750f875a1a3c9079af49b315b2f7c8f`;

  try {
    const response = await fetch(waqiApiUrl);

    if (response.ok) {
      const data = await response.json();
      console.log('WAQI API Response:', data);

      if (data.status === 'ok') {
        const aqiValue = data.data.aqi;
        return aqiValue !== undefined ? aqiValue : null;
      } else {
        console.warn('No air quality measurements found.');
        return null;
      }
    } else {
      console.error('Error fetching air quality data:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('An error occurred while fetching air quality data:', error);
    return null;
  }
}

// Function to display air quality in the DOM
function displayAirQuality(aqiValue) {
  const airQualityElement = document.querySelector(".air-quality");
  airQualityElement.innerHTML = `<p>AQI: ${aqiValue !== null ? aqiValue : 'N/A'}</p>`;
}

////////////////////////////////////////////////////
async function getNWSAlerts(latitude, longitude) {
  const nwsApiUrl = `https://api.weather.gov/alerts?point=${latitude},${longitude}`;

  try {
    const response = await fetch(nwsApiUrl, {
      headers: {
        'User-Agent': 'YourApp',
      },
    });

    if (response.ok) {
      const data = await response.json();
      const alerts = data.features;
      return alerts;
    } else {
      console.error('Error fetching NWS alerts:', response.status, response.statusText);
      return null;
    }
  } catch (error) {
    console.error('An error occurred while fetching NWS alerts:', error);
    return null;
  }
}


function displayNWSAlerts(alerts) {
  const alertsList = document.getElementById('alerts-list');
  alertsList.innerHTML = '';

  if (alerts && alerts.length > 0) {
    const filteredAlerts = alerts.filter(alert => {
      const eventType = alert.properties.event.toLowerCase();
      return eventType === 'warning' || eventType === 'special weather statement';
    });

    if (filteredAlerts.length > 0) {
      filteredAlerts.forEach(alert => {
        const listItem = document.createElement('li');
        listItem.textContent = `${alert.properties.event}: ${alert.properties.description}`;
        alertsList.appendChild(listItem);
      });
    } else {
      const noAlertsItem = document.createElement('li');
      noAlertsItem.textContent = 'No warnings or special weather statements for the specified location.';
      alertsList.appendChild(noAlertsItem);
    }
  } else {
    const noAlertsItem = document.createElement('li');
    noAlertsItem.textContent = 'No alerts for the specified location.';
    alertsList.appendChild(noAlertsItem);
  }
}

////////////////////////////////////////////////////
async function getNews(city) {
  const newsApiUrl = `https://newsapi.org/v2/top-headlines?q=${city}&apiKey=5daecf6f718342f2b20c700b00e2c3e1`;
  try {
    const response = await fetch(newsApiUrl);
    const data = await response.json();
    return data.articles.slice(0, 3);
  } catch (error) {
    console.error("Error fetching news:", error);
    return null;
  }
}

// Function to display news articles in the DOM
function displayNews(articles) {
  const topNewsList = document.getElementById("topNewsList");
  topNewsList.innerHTML = "";

  if (articles && articles.length > 0) {
    articles.forEach(article => {
      const listItem = document.createElement("li");
      const image = article.urlToImage ? `<img src="${article.urlToImage}" alt="News Image" style="width: 100%; height: auto;">` : '';
      listItem.innerHTML = `
        <div style="margin-bottom: 10px;">
          <h1 style="font-size: 16px; margin-bottom: 5px;">${article.title}</h1>
          ${image}
          <p style="font-size: 14px; margin-top: 5px;">${article.description || ''}</p>
        </div>`;
      topNewsList.appendChild(listItem);
    });
  } else {
    const noNewsItem = document.createElement("li");
    noNewsItem.textContent = "No news articles found for the specified city.";
    topNewsList.appendChild(noNewsItem);
  }
}


////////////////////////////////////////////////////
async function checkWeatherByCoordinates(latitude, longitude) {
  try {
    const response = await fetch(`${apiUrl}&lat=${latitude}&lon=${longitude}&appid=${apiKey}`);

    if (response.status === 404) {
      handleWeatherError();
    } else {
      const data = await response.json();
      displayWeatherData(data);
      const nwsAlerts = await getNWSAlerts(latitude, longitude);
      displayNWSAlerts(nwsAlerts);
      const newsArticles = await getNews(data.name);
      displayNews(newsArticles);
      const airQuality = await getAirQuality(latitude, longitude);
      displayAirQuality(airQuality);
    }
  } catch (error) {
    console.error('An error occurred while fetching weather data:', error);
    handleWeatherError();
  }
}

function displayWeatherData(data) {
  document.querySelector(".city").innerHTML = data.name;
  document.querySelector(".temp").innerHTML = Math.round(data.main.temp) + "°C";
  document.querySelector(".humidity").innerHTML = data.main.humidity + "%";
  document.querySelector(".wind").innerHTML = data.wind.speed + " km/h";
  document.querySelector(".feels_like").innerHTML = "Feels like: " + Math.round(data.main.feels_like) + "°C";
  document.querySelector(".pressure").innerHTML = "Pressure " + data.main.pressure + "atm";
  document.querySelector(".code").innerHTML = "Country code: " + data.sys.country;
  if (data.rain && data.rain['1h'] !== undefined) {
    document.querySelector(".rain").innerHTML = "Rain amount: " + data.rain['1h'] + "mm";
  } else {
    document.querySelector(".rain").innerHTML = "No rain in the last hour";
  }

  const weatherArray = data.weather;
  if (weatherArray && weatherArray.length > 0) {
    const weatherObject = weatherArray[0];
    const description = weatherObject.description;

  document.querySelector(".description").innerHTML = description;
  } else {
    console.log('No weather information available.');
  }


  if (data.weather[0].main == "Clouds") {
    weatherIcon.src = "images/clouds.png";
  } else if (data.weather[0].main == "Clear") {
    weatherIcon.src = "images/clear.png";
  } else if (data.weather[0].main == "Rain") {
    weatherIcon.src = "images/rain.png";
  } else if (data.weather[0].main == "Drizzle") {
    weatherIcon.src = "images/drizzle.png";
  } else if (data.weather[0].main == "Mist") {
    weatherIcon.src = "images/mist.png";
  } else if (data.weather[0].main == "Snow") {
    weatherIcon.src = "images/snow.png";
  }

  document.querySelector(".weather").style.display = "block";
  document.querySelector(".error").style.display = "";
}

function handleWeatherError() {
  document.querySelector(".error").style.display = "block";
  document.querySelector(".weather").style.display = "none";
}

searchBox.addEventListener("keydown", async (event) => {
  if (event.key === "Enter") {
    await performSearch();
  }
});

async function performSearch() {
  const city = searchBox.value.trim();
  if (city) {
    const coordinates = await getCityCoordinates(city);
    if (coordinates) {
      map.setView([coordinates.lat, coordinates.lon], 10);
      await checkWeatherByCoordinates(coordinates.lat, coordinates.lon);
    } else {
      console.error('Failed to get coordinates for the city:', city);
    }
  }
}

function toggleSidebar() {
  var sidebar = document.getElementById('sidebar');
  if (sidebar.style.right === '-400px' || sidebar.style.right === '') {
    sidebar.style.right = '0';
  } else {
    sidebar.style.right = '-400px';
  }
}
initMap(51.1657, 71.4186);  
