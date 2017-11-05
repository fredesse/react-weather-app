import React, { Component } from 'react';
import '../css/App.css';
import '../css/toggleButton.css';
import '../css/dashboard.css';
import axios from 'axios';
import Toggle from 'react-toggle';

import Search from 'react-icons/lib/md/search';
import BackArrow from 'react-icons/lib/md/arrow-back';

//retrieve the API key and store it as a variable
const api_key = process.env.REACT_APP_API_KEY;
const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday"];
const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      latitude: '',
      longitude: '',
      city: '',
      tempInCelsius: true,
      displayWeather: false,
      currentDate: '',
      currentWeatherDesc: '',
      currentTemp: '',
      currentWeatherIcon: '',
      currentWeatherMorning: '',
      currentWeatherDay: '',
      currentWeatherEvening: '',
      currentWeatherNight: '',
      forecast: '',
      fiveDayForecast: []
    }
  }

  //get current location of user and call the API
  getLocation = () => {
    let showPosition = (position) => {
      this.setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
      console.log("STATE", this.state);
      let lat = this.state.latitude;
      let lon = this.state.longitude;
      this.axiosGETreq(`lat=${lat}&lon=${lon}&APPID=${api_key}`);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(showPosition);
      console.log("DONE!");
    } else {
      alert("Current location is not supported by this browser");
    }
  }

  //update state with search value
  handleSearch = (event) => {
    this.setState({
      city: event.target.value
    });
    console.log("CITY", this.state.city);
  }

  //submit a GET request
  handleSubmit = (e) => {
    e.preventDefault();
    let loc = this.state.city;
    this.axiosGETreq(`q=${loc}&APPID=${api_key}`);
  }

  axiosGETreq = (URL) => {
    axios.get(`http://api.openweathermap.org/data/2.5/forecast?${URL}`)
      .then(res => {
        console.log("AXIOS RESPONSE:", res.data);
        let weatherData = {
          latitude: res.data.city.coord.lat,
          longitude: res.data.city.coord.lon,
          city: res.data.city.name,
          displayWeather: true,
          currentDate: res.data.list[0].dt_txt,
          currentWeatherDesc: res.data.list[0].weather[0].description,
          currentWeatherIcon: res.data.list[0].weather[0].icon,
          currentTemp: res.data.list[0].main.temp,
          forecast: res.data.list
        }
        this.setState({
          latitude: weatherData.latitude,
          longitude: weatherData.longitude,
          city: weatherData.city,
          displayWeather: weatherData.displayWeather,
          currentDate: weatherData.currentDate,
          currentWeatherDesc: weatherData.currentWeatherDesc,
          currentWeatherIcon: weatherData.currentWeatherIcon,
          currentTemp: weatherData.currentTemp,
          forecast: weatherData.forecast
        });
        this.getTodaysTemps();
        this.getFiveDayForecast();
        console.log("TODAY", this.state.fiveDayForecast);
        localStorage.setItem('data', JSON.stringify(weatherData));
      })
      .catch(error => {
        console.log(error);
      });
  }

  calculateTemp = (temp) => {
    if (this.state.tempInCelsius) {
      return Math.round(temp - 273.15) + "℃";
    }
    return Math.round((temp * 9/5) - 459.67) + "℉";
  }

  findDate = () => {
    let date = new Date();
    let day = date.getDate();
    let weekday = date.getDay();
    let month = date.getMonth();
    let year = date.getFullYear();
    return `${days[weekday]}, ${months[month]} ${day} ${year}`
  }

  getTodaysTemps = () => {
    let forecast = this.state.forecast;
    let todaysTemps = {};
    for(let i = 0; i < 8; i++) {
      if (forecast[i].dt_txt[12] === "6") {
        this.setState({currentWeatherMorning: forecast[i].main.temp});
        todaysTemps["currentWeatherMorning"] = forecast[i].main.temp;
      }
      if (forecast[i].dt_txt[12] === "2") {
        this.setState({currentWeatherDay: forecast[i].main.temp});
        todaysTemps["currentWeatherDay"] = forecast[i].main.temp;
      }
      if (forecast[i].dt_txt[12] === "8") {
        this.setState({currentWeatherEvening: forecast[i].main.temp});
        todaysTemps["currentWeatherEvening"] = forecast[i].main.temp;
      }
      if (forecast[i].dt_txt[12] === "0") {
        this.setState({currentWeatherNight: forecast[i].main.temp});
        todaysTemps["currentWeatherNight"] = forecast[i].main.temp;
      }
    }
    console.log("POOO", todaysTemps);
    localStorage.setItem('todaysTemps', JSON.stringify(todaysTemps));
  }

  getFiveDayForecast = () => {
    let forecast = this.state.forecast;
    let container = [];
    for (let i = 0; i < forecast.length; i++) {
      if (forecast[i].dt_txt[12] === "2") {
        container.push(forecast[i]);
      }
    }
    if (container.length === 4) {
      let today = {
        main: {
          temp: this.state.currentTemp
        },
        weather: [
          {
          icon: this.state.currentWeatherIcon
          }
        ]
      };
      container.unshift(today);
    }
    this.setState({fiveDayForecast: container});
    localStorage.setItem('fiveDayForecast', JSON.stringify(this.state.fiveDayForecast));
    console.log("I WAS EXECUTED");
  }

  whatDayIsIt = (index) => {
    let date = new Date();
    let weekday = date.getDay();
    return days[weekday + index];
  }

  handleTempChange = (e) => {
    console.log("TEMP", e.target.checked);
    this.setState({tempInCelsius: e.target.checked});
    this.forceUpdate();
  }

  componentDidMount = () => {
    const cachedData = JSON.parse(localStorage.getItem('data'));
    const cachedFiveDayForecast = JSON.parse(localStorage.getItem('fiveDayForecast'));
    const cachedTodaysTemps = JSON.parse(localStorage.getItem('todaysTemps'));

    if (cachedData) {
      console.log("CACHED DATA", cachedData);
      console.log("CONTAINER", cachedFiveDayForecast);
      console.log("WHEEEE", cachedTodaysTemps);
      //set state with cached data
      this.setState({
        latitude: cachedData.latitude,
        longitude: cachedData.longitude,
        city: cachedData.city,
        displayWeather: cachedData.displayWeather,
        currentDate: cachedData.currentDate,
        currentWeatherDesc: cachedData.currentWeatherDesc,
        currentWeatherIcon: cachedData.currentWeatherIcon,
        currentTemp: cachedData.currentTemp,
        forecast: cachedData.forecast,
        fiveDayForecast: cachedFiveDayForecast,
        currentWeatherMorning: cachedTodaysTemps.currentWeatherMorning,
        currentWeatherDay: cachedTodaysTemps.currentWeatherDay,
        currentWeatherEvening: cachedTodaysTemps.currentWeatherEvening,
        currentWeatherNight: cachedTodaysTemps.currentWeatherNight
      });
    }
  }

  render() {
    return (
      <div>
        {
          !this.state.displayWeather && (
            <div className="search-container">
              <form onSubmit={this.handleSubmit}>
                <input className="search-input" type="text" value={this.state.city} placeholder="City" onChange={this.handleSearch}/>
                <Search size={35} className="search-icon" onClick={ (e) => { this.handleSubmit(e)}} />
              </form>
              <p>or</p>
              <p className="search-curent-loc">use my <a onClick={() => { this.getLocation()}}>current position</a></p>
            </div>
          )
        }
        {
          this.state.displayWeather && (
            <div className="weather-container">
              <div className="upper-section">
                <div className="back-and-city">
                  <BackArrow size={35} onClick={ () => { this.setState({displayWeather: false})}} />
                  <h2 className="city-desktop">{this.state.city}</h2>
                </div>
                <div>
                  <label>
                    <Toggle
                      defaultChecked={this.state.tempInCelsius}
                      className='custom-classname'
                      icons={{
                        checked: "ON",
                        unchecked: "OFF",
                      }}
                      onChange={this.handleTempChange} />
                  </label>
                </div>
              </div>
              <h2 className="city-mobile">{this.state.city}</h2>
              <div>
                <div className="date-weather">
                  <h3>{this.findDate()}</h3>
                  <h4>{this.state.currentWeatherDesc}</h4>
                </div>
                <div>
                  <div>{this.calculateTemp(this.state.currentTemp)}</div>
                  <div>{this.state.currentWeatherIcon}</div>
                  <div>
                    <div>
                      <div>Morning</div>
                      <div>{this.calculateTemp(this.state.currentWeatherMorning)}</div>
                    </div>
                    <div>
                      <div>Day</div>
                      <div>{this.calculateTemp(this.state.currentWeatherDay)}</div>
                    </div>
                    <div>
                      <div>Evening</div>
                      <div>{this.calculateTemp(this.state.currentWeatherEvening)}</div>
                    </div>
                    <div>
                      <div>Night</div>
                      <div>{this.calculateTemp(this.state.currentWeatherNight)}</div>
                    </div>
                  </div>
                </div>
                <div>
                  <div>
                    {this.state.fiveDayForecast.map((forecast, index) => (
                      <div>
                        {this.whatDayIsIt(index)}
                        {forecast.weather[0].icon}
                        <h3>{this.calculateTemp(forecast.main.temp)}</h3>
                      </div>
                    )
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        }
      </div>
    );
  }
}

export default App;
//fix current date, get it from state
//on refresh don't change F back to C
//<button onClick={ () => {this.poopy()}}>CLICK</button>
//
//<input type="submit"/>