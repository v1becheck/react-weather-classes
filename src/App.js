import React from 'react';

function getWeatherIcon(wmoCode) {
  const icons = new Map([
    [[0], '☀️'],
    [[1], '🌤'],
    [[2], '⛅️'],
    [[3], '☁️'],
    [[45, 48], '🌫'],
    [[51, 56, 61, 66, 80], '🌦'],
    [[53, 55, 63, 65, 57, 67, 81, 82], '🌧'],
    [[71, 73, 75, 77, 85, 86], '🌨'],
    [[95], '🌩'],
    [[96, 99], '⛈'],
  ]);
  const arr = [...icons.keys()].find((key) => key.includes(wmoCode));
  if (!arr) return 'NOT FOUND';
  return icons.get(arr);
}

function convertToFlag(countryCode) {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt());
  return String.fromCodePoint(...codePoints);
}

function formatDay(dateStr) {
  return new Intl.DateTimeFormat('en', {
    weekday: 'short',
  }).format(new Date(dateStr));
}

class App extends React.Component {
  state = {
    location: '',
    isLoading: false,
    displayLocation: '',
    weather: {},
    requestTimestamps: [],
  };

  isRateLimited = () => {
    const currentTime = Date.now();
    const fiveMinutesAgo = currentTime - 300000; // 5 minutes in milliseconds

    // Filter out requests that are older than 5 minutes
    const recentRequests = this.state.requestTimestamps.filter(
      (timestamp) => timestamp > fiveMinutesAgo
    );

    return recentRequests.length >= 100;
  };

  fetchWeather = async () => {
    if (this.state.location.length < 2) return this.setState({ weather: {} });

    if (this.isRateLimited()) {
      console.log('Rate limit reached. Please wait.');
      return; // Exit the function if rate limited
    }

    try {
      this.setState({ isLoading: true });

      // 1) Getting location (geocoding)
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${this.state.location}`
      );
      const geoData = await geoRes.json();
      console.log(geoData);

      if (!geoData.results) throw new Error('Location not found');

      const { latitude, longitude, timezone, name, country_code } =
        geoData.results.at(0);
      this.setState({
        displayLocation: `${name} ${convertToFlag(country_code)}`,
      });

      // 2) Getting actual weather
      const weatherRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&timezone=${timezone}&daily=weathercode,temperature_2m_max,temperature_2m_min`
      );
      const weatherData = await weatherRes.json();
      this.setState({ weather: weatherData.daily });
    } catch (err) {
      console.error(err);
    } finally {
      this.setState({ isLoading: false });
      this.setState((prevState) => ({
        requestTimestamps: [...prevState.requestTimestamps, Date.now()],
      }));
    }
  };

  setLocation = (e) => {
    const locationInput = e.target.value;

    if (locationInput.length > 0 && !locationInput.match(/^[a-zA-Z\s,]+$/)) {
      console.error(
        'Invalid location format. Only letters, spaces, and commas are allowed.'
      );
      return;
    }

    this.setState({ location: locationInput });
  };

  // useEffect []
  componentDidMount() {
    // this.fetchWeather();

    this.setState({ location: localStorage.getItem('location') || '' });
  }

  // useEffect [location]
  componentDidUpdate(prevProps, prevState) {
    if (this.state.location !== prevState.location) {
      this.fetchWeather();

      localStorage.setItem('location', this.state.location);
    }
  }

  render() {
    return (
      <div className='app'>
        <h1>Classy Weather</h1>
        <Input
          location={this.state.location}
          onChangeLocation={this.setLocation}
        />
        {/* <button onClick={this.fetchWeather}>Get Weather</button> */}

        {this.state.isLoading && <p className='laoder'>Loading...</p>}

        {this.state.weather.weathercode && (
          <Weather
            weather={this.state.weather}
            location={this.state.displayLocation}
          />
        )}
      </div>
    );
  }
}

export default App;

class Input extends React.Component {
  render() {
    return (
      <div>
        <input
          type='text'
          placeholder='City, Country'
          value={this.props.location}
          onChange={this.props.onChangeLocation}
        />
      </div>
    );
  }
}

class Weather extends React.Component {
  // useEffect cleanup function
  componentWillUnmount() {
    console.log('Weather unmounting...');
  }

  render() {
    const {
      temperature_2m_max: max,
      temperature_2m_min: min,
      time: dates,
      weathercode: codes,
    } = this.props.weather;

    return (
      <div>
        <h2>Weather {this.props.location}</h2>
        <ul className='weather'>
          {dates.map((date, index) => (
            <Day
              date={date}
              max={max.at(index)}
              min={min.at(index)}
              code={codes.at(index)}
              key={index}
              isToday={index === 0}
              // icon={getWeatherIcon(codes[index])}
            />
          ))}
        </ul>
      </div>
    );
  }
}

class Day extends React.Component {
  render() {
    const { date, max, min, code, isToday } = this.props;

    return (
      <li className='day'>
        <span>{getWeatherIcon(code)}</span>
        <p>{isToday ? 'Today' : formatDay(date)}</p>
        <p>
          {Math.floor(min)}&deg; &mdash; <strong>{Math.ceil(max)}&deg;</strong>
        </p>
        <p>
          {this.props.minTemp} {this.props.maxTemp}
        </p>
      </li>
    );
  }
}
