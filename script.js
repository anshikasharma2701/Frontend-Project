var isCelsius = true;
var weather = null;

// Built-in cities (works offline too)
var demo = {
  "new delhi": { city: "New Delhi, IN", temp: 34, feels: 37, hum: 42, wind: 14, rain: 10, code: 0 },
  "mumbai":    { city: "Mumbai, IN",    temp: 29, feels: 33, hum: 82, wind: 22, rain: 75, code: 63 },
  "london":    { city: "London, UK",    temp: 14, feels: 12, hum: 70, wind: 19, rain: 30, code: 3 },
  "tokyo":     { city: "Tokyo, JP",     temp: 21, feels: 21, hum: 55, wind: 12, rain: 15, code: 1 },
  "new york":  { city: "New York, US",  temp: 4,  feels: 1,  hum: 60, wind: 26, rain: 45, code: 71 }
};

function text(id, val) { document.getElementById(id).innerText = val; }
function deg(c) { return Math.round(isCelsius ? c : (c * 9) / 5 + 32) + (isCelsius ? "°C" : "°F"); }

// Switch between Dashboard, 5-Day Forecast, and Alerts & Guide pages
function openPage(pageId, btn) {
  document.querySelectorAll(".page").forEach(function(p) { p.classList.remove("active"); });
  document.querySelectorAll(".nav-btn").forEach(function(b) { b.classList.remove("active"); });
  document.getElementById(pageId).classList.add("active");
  btn.classList.add("active");
}

function getInfo(code) {
  if (code <= 1) return { name: "Sunny",  icon: "☀️",  theme: "theme-sunny" };
  if (code >= 95) return { name: "Stormy", icon: "⛈️", theme: "theme-storm" };
  if (code >= 71 && code <= 86) return { name: "Snowy", icon: "❄️", theme: "theme-snow" };
  if (code >= 51) return { name: "Rainy",  icon: "🌧️", theme: "theme-rainy" };
  return { name: "Cloudy", icon: "⛅", theme: "theme-cloudy" };
}

function getAlert(temp, wind, name) {
  if (name === "Stormy") return { lvl: "level-danger", badge: "SEVERE ALERT", title: "Thunderstorm Warning", desc: "Lightning & heavy gusts expected.", travel: "Avoid driving", comfort: "Stay indoors", tips: ["🔌 Unplug electronics", "🏠 Stay away from trees", "🚗 Postpone travel"] };
  if (temp >= 38)        return { lvl: "level-danger", badge: "HEAT ALERT",   title: "Extreme Heatwave",     desc: "Very high temperature today.",      travel: "Travel early/late", comfort: "Very hot", tips: ["💧 Drink water often", "🧢 Wear light cotton", "⏰ Avoid 12–4 PM sun"] };
  if (name === "Rainy")  return { lvl: "level-warn",   badge: "RAIN ALERT",   title: "Rain & Wet Roads",     desc: "Rainfall expected outside.",        travel: "Slippery roads", comfort: "Humid & wet", tips: ["☂️ Carry an umbrella", "👟 Wear waterproof shoes", "🚦 Drive slowly"] };
  if (temp <= 5 || name === "Snowy") return { lvl: "level-warn", badge: "COLD ALERT", title: "Cold Weather", desc: "Low temperatures outside.",         travel: "Check fog/frost", comfort: "Chilly", tips: ["🧥 Wear a warm jacket", "☕ Drink hot tea", "🧣 Cover hands & ears"] };
  if (wind >= 35)        return { lvl: "level-warn",   badge: "WIND ALERT",   title: "Strong Wind Advisory", desc: "Gusty winds outside.",              travel: "Hold wheel steady", comfort: "Windy", tips: ["🪟 Secure windows", "🚴 Ride carefully", "🕶️ Protect your eyes"] };
  return { lvl: "level-safe", badge: "ALL CLEAR", title: "Pleasant Weather", desc: "No severe weather alerts.", travel: "Smooth roads", comfort: "Comfortable", tips: ["🚶 Great time for a walk", "🧴 Use sunscreen if sunny", "😊 Enjoy your day!"] };
}

function showUI() {
  var info = getInfo(weather.code);
  document.body.className = info.theme;

  text("cityName", weather.city);
  text("forecastCity", weather.city);
  text("dateText", new Date().toDateString());
  text("weatherIcon", info.icon);
  text("tempValue", deg(weather.temp));
  text("conditionText", info.name);
  text("feelsLike", "Feels like " + deg(weather.feels));
  text("humidity", weather.hum + "%");
  text("wind", Math.round(weather.wind) + " km/h");
  text("rainChance", weather.rain + "%");

  var tom = weather.days[1];
  text("tomorrowText", getInfo(tom.code).name + " (" + deg(tom.max) + " / " + deg(tom.min) + ")");

  var a = getAlert(weather.temp, weather.wind, info.name);
  document.getElementById("alertBox").className = "alert-box " + a.lvl;
  text("alertBadge", a.badge);
  text("alertTitle", a.title);
  text("alertDesc", a.desc);
  text("travelAlert", a.travel);
  text("comfortAlert", a.comfort);
  text("guideSummary", weather.city + " status: " + a.title + " — " + a.desc);
  document.getElementById("suggestionList").innerHTML = "<li>" + a.tips.join("</li><li>") + "</li>";

  var cards = "";
  for (var i = 0; i < 5; i++) {
    var d = weather.days[i], di = getInfo(d.code);
    cards += '<div class="day-card"><span>' + d.day + '</span><span class="icon">' + di.icon +
      '</span><span class="muted">' + di.name + '</span><span class="temps">' + deg(d.max) + " / " + deg(d.min) + "</span></div>";
  }
  document.getElementById("forecastGrid").innerHTML = cards;
}

async function searchCity(city) {
  text("statusMsg", "Loading " + city + "...");
  try {
    var geoRes = await fetch("https://geocoding-api.open-meteo.com/v1/search?count=1&name=" + city);
    var p = (await geoRes.json()).results[0];
    await loadByCoords(p.latitude, p.longitude, p.name + ", " + p.country_code);
  } catch (e) {
    var d = demo[city.toLowerCase()];
    if (!d) return text("statusMsg", "City not found. Try New Delhi, Mumbai, London, Tokyo, or New York.");
    d.days = [];
    for (var i = 0; i < 5; i++) d.days.push({ day: "Day " + (i + 1), code: d.code, max: d.temp + 2 - i, min: d.temp - 5 });
    weather = d;
    showUI();
    text("statusMsg", "Showing offline demo weather.");
  }
}

async function loadByCoords(lat, lon, label) {
  var res = await fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lat + "&longitude=" + lon +
    "&current=temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto");
  var data = await res.json();
  var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"], list = [];
  for (var i = 0; i < 5; i++) {
    list.push({
      day: dayNames[new Date(data.daily.time[i] + "T12:00:00").getDay()],
      code: data.daily.weather_code[i], max: data.daily.temperature_2m_max[i], min: data.daily.temperature_2m_min[i]
    });
  }
  weather = {
    city: label, temp: data.current.temperature_2m, feels: data.current.apparent_temperature,
    hum: data.current.relative_humidity_2m, wind: data.current.wind_speed_10m,
    rain: data.daily.precipitation_probability_max[0] || 0, code: data.current.weather_code, days: list
  };
  showUI();
  text("statusMsg", "");
}

document.getElementById("searchForm").onsubmit = function(e) {
  e.preventDefault();
  var val = document.getElementById("cityInput").value.trim();
  if (val) searchCity(val);
};
document.querySelectorAll(".chip[data-city]").forEach(function(btn) {
  btn.onclick = function() { searchCity(btn.getAttribute("data-city")); };
});
document.getElementById("unitBtn").onclick = function() {
  isCelsius = !isCelsius; this.innerText = isCelsius ? "°C" : "°F"; if (weather) showUI();
};
document.getElementById("locBtn").onclick = function() {
  navigator.geolocation.getCurrentPosition(
    function(pos) { loadByCoords(pos.coords.latitude, pos.coords.longitude, "Your Location"); },
    function() { text("statusMsg", "Location denied. Please search a city."); }
  );
};

searchCity("New Delhi");
