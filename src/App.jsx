import { useState } from 'react';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import RestoreIcon from '@mui/icons-material/Restore';
import FavoriteIcon from '@mui/icons-material/Favorite';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import BottomNavigation from '@mui/material/BottomNavigation';
import BottomNavigationAction from '@mui/material/BottomNavigationAction';
import './App.css';
import AirIcon from '@mui/icons-material/Air';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import WaterIcon from '@mui/icons-material/Water';
import UmbrellaIcon from '@mui/icons-material/Umbrella';
import Alert from '@mui/material/Alert';
import CheckIcon from '@mui/icons-material/Check';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';


// Create a dark theme
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000',
      paper: '#1c1c1c',
    },
    text: {
      primary: '#ffffff',
    },
  },
});

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [videoUrl, setVideoUrl] = useState('');
  const [error, setError] = useState('');
  const [value, setValue] = useState(0);
  const [weatherVideoUrl, setWeatherVideoUrl] = useState(''); 
  const [isLocationSet, setIsLocationSet] = useState(false);
  const [alertMessage, setAlertMessage] = useState('')
  const [alertVisible, setAlertVisible] = useState(false);
  const [localTime, setLocalTime] = useState('');
  const [livestreamError, setLivestreamError] = useState('');
  const [history, setHistory]= useState([]);

  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);


  // Handle input change
  const handleChange = (e) => {
    setCity(e.target.value);
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const resetLivestreamError = () => {
    setLivestreamError(''); 
  };
  const formatDateToEuropean = (date) => {
    const options = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false, 
    };
  
    return new Intl.DateTimeFormat('de-DE', options).format(date);
  };

  function formatForecastDate(date) {
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(date).toLocaleDateString('de-DE', options);
  }
  
  
const getCurrentLocation = async () => {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const cityName = await fetchCityFromCoordinates(latitude, longitude);
        if (cityName) {
          setCity(cityName); 
          setAlertMessage(`Ihr Standort wurde auf ${cityName} gesetzt!`); 
          setIsLocationSet(true);
           setAlertVisible(true); 

        
            setTimeout(() => {
              setAlertVisible(false); 
              setAlertMessage(''); 
            }, 2000);
        } else {
          setError('Standort konnte nicht ermittelt werden.'); 
        }
      },
      (error) => {
        setError('Standort konnte nicht ermittelt werden: ' + error.message);
      }
    );
  } else {
 

  }
};


const fetchCityFromCoordinates = async (latitude, longitude) => {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`
    );
    if (!response.ok) {
      throw new Error('Konnte den Standort nicht ermitteln'); 
    }
    const data = await response.json();
    return data.address.city || data.address.town || data.address.village || 'Unbekannter Standort'; 
  } catch (error) {
    setError(error.message);
    return null;
  }
};



  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!city) {
      setError('Bitte geben Sie einen Standort ein.'); 
      return;
    }

    setError('');
    setWeather(null);
    setVideoUrl('');
    setWeatherVideoUrl(''); 
    resetLivestreamError(); 
    
    setHistory((prevHistory) => [...prevHistory, city]);

  
    try {
      const currentWeatherPromise = fetch(
        `http://api.weatherapi.com/v1/current.json?key=${import.meta.env.VITE_WEATHER_API_KEY}&q=${city}`
      );

      const forecastPromise = fetch(
        `http://api.weatherapi.com/v1/forecast.json?key=${import.meta.env.VITE_WEATHER_API_KEY}&q=${city}&days=3`
      );

      const [currentWeatherResponse, forecastResponse] = await Promise.all([currentWeatherPromise, forecastPromise]);

      if (!currentWeatherResponse.ok || !forecastResponse.ok) {
        throw new Error('Standort nicht gefunden'); 
      }

      const currentWeatherData = await currentWeatherResponse.json();
      const forecastData = await forecastResponse.json();

      const combinedWeatherData = {
        current: currentWeatherData.current,
        location: currentWeatherData.location,
        forecast: forecastData.forecast,
      };

      setWeather(combinedWeatherData);
      const localTime = combinedWeatherData.location.localtime;


      const formattedLocalTime = formatDateToEuropean(new Date(localTime));
  
  
      setLocalTime(formattedLocalTime);

      const condition = currentWeatherData.current.condition.text; 
      let videoSrc = '';

      switch (condition) {
        case 'Clear':
          videoSrc = '/videos/clear-sky-video.mp4';
          break;
        case 'Light rain':
          videoSrc = '/videos/rainy-video.mp4';
          break;
        case 'Snow':
          videoSrc = '/videos/snowy-video.mp4';
          break;
        case 'Overcast':
          videoSrc = '/videos/cloudy-video.mp4';
          break;
        case 'Sunny':
          videoSrc = '/videos/sunny-video.mp4';
          break;
        default:
          videoSrc = ''; 
      }

      if (videoSrc) {
        setWeatherVideoUrl(videoSrc);
      } else {
        setError('Keine passende Hintergrundvideo gefunden.'); 
      }

    
      const foundVideoId = getVideoIdForCity(city);
      if (foundVideoId) {
        setVideoUrl(`https://www.youtube.com/embed/${foundVideoId}?autoplay=1&mute=1&controls=0&showinfo=0&modestbranding=1&rel=0`);
      } else {
     
        setLivestreamError('Keine Live-Übertragung für diese Stadt gefunden.'); 
      }


      

    } catch (err) {
      setError(err.message);
      return;
    }
  };

  


  

 
  const getVideoIdForCity = (city) => {
    switch (city) {
      case 'Stuttgart':
        return 'YOUR_STUTTGART_VIDEO_ID';
      case 'Rome':
        return 'YOUR_ROME_VIDEO_ID';
      case 'Tiflis':
        return '_fDYKDeZC9c';
      case 'New York':
        return 'mOuVHSuvAbg'; 
      default:
        return null; 
    }
  };

 

  return (
    <ThemeProvider theme={theme}>
      <div className="App" style={{ backgroundColor: '#000000', minHeight: '100vh', color: '#ffffff' }}>
        {videoUrl && (
          <div className="video-container">
            <iframe
              className="video-iframe"
              src={videoUrl}
              frameBorder="0"
              allow="autoplay; encrypted-media; picture-in-picture"
              allowFullScreen
              title="YouTube Video"
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: '100vw',
                height: '100vh',
                border: 'none',
              }}
            />
          </div>
        )}

        <Box
          component="form"
          sx={{ display: 'flex', alignItems: 'center', position: 'fixed', top: 20, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}
          noValidate
          autoComplete="off"
          onSubmit={handleSubmit}
        >
          <TextField
            id="outlined-basic"
            label="Ihr Standort"
            variant="outlined"
            value={city}
            onChange={handleChange}
            sx={{
              input: { color: 'white' },
              label: { color: 'white' },
              '& .MuiOutlinedInput-root': {
                '& fieldset': {
                  borderColor: 'white',
                },
                '&:hover fieldset': {
                  borderColor: 'blue',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'blue',
                },
              },
            }}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{
              mt: 0,
              mb: 0,
              ml: 1,
              height: '40px',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            Wetter abrufen
          </Button>
        </Box>

        {error && <p style={{ color: 'red', position: 'fixed', top: 100, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>{error}</p>}

        {/* Display Weather Information */}
        {weather && (
          <Card sx={{ minWidth: 450, margin: '20px auto', backgroundColor: '#1c1c1c', color: 'white', position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
            <CardContent sx={{ position: 'relative' }}>
              {/* Background Video */}
              {weatherVideoUrl && (
                <video
                  autoPlay
                  loop
                  muted
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: 1,
                    borderRadius: '4px',
                  }}
                >
                  <source src={weatherVideoUrl} type="video/mp4" />
                </video>
              )}
              <Typography variant="h5" component="div" textAlign="center" sx={{ zIndex: 2, position: 'relative' }}>
                Wetter in {weather.location.name}
              </Typography>
              <Typography variant="body2" textAlign="center" sx={{ zIndex: 2, position: 'relative', marginTop: 1 }}>
      {formatDateToEuropean(new Date())} 
    </Typography>
    <Typography variant="body2" textAlign="center" sx={{ zIndex: 2, position: 'relative', marginTop: 1 }}>
  Lokale Zeit: {localTime} 
</Typography>
              <Box sx={{ zIndex: 2, position: 'relative', marginTop: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
                  <img
                    src={`https:${weather.current.condition.icon}`}
                    alt={weather.current.condition.text}
                    style={{ width: '50px', height: '50px', marginRight: '10px' }}
                  />
                  <Typography variant="body2">Temperatur: {weather.current.temp_c}°C</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
                  <WaterIcon sx={{ marginRight: '10px' }} /> 
                  <Typography variant="body2">Luftfeuchtigkeit: {weather.current.humidity}%</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
                  <AirIcon />
                  <Typography variant="body2">Windgeschwindigkeit: {weather.current.wind_kph} km/h</Typography>
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
                  <WbSunnyIcon />
                  <Typography variant="body2">UV-Index: {weather.current.uv}</Typography>
                </Box>

                {/* Rain Probability */}
                {weather.forecast.forecastday && weather.forecast.forecastday.length > 0 && (
                  <Typography variant="body2">
                    <UmbrellaIcon />
                    {`Regenwahrscheinlichkeit für heute: ${weather.forecast.forecastday[0].day.daily_chance_of_rain}%`}
                  </Typography>
                )}
              </Box>
            </CardContent>
            
          </Card>
          
        )} 
         
        
  
        {alertMessage && (
          <Alert 
            severity="success" 
            onClose={() => setAlertMessage('')} 
            sx={{ position: 'fixed', top: 120, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}
          >
            {alertMessage}
          </Alert>
        )}

{weather && (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'row', 
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
      borderRadius: 2,
      boxShadow: 3, 
      position: 'fixed',
      top: 500,
      left: '50%',
      alignItems: 'center',
      transform: 'translateX(-50%)',
      zIndex: 2,
      whiteSpace: 'nowrap',
    }}
  >
    
   
    
    {weather.forecast.forecastday.map((day, index) =>
    
      index > 0 && index <= 3 && (
        <Card
          key={day.date}
          sx={{
            maxWidth: 500,
            margin: '20px', 
            backgroundColor: '#1c1c1c', 
            color: 'white',
            position: 'relative', 
          }}
        >
          <CardContent >
            
            <Typography variant="h5" component="div" textAlign="center">
              Vorhersage für {formatForecastDate(new Date(day.date))}
              
            </Typography>
    
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1, marginTop: 2 }}>
              <img
                src={day.day.condition.icon}
                alt={day.day.condition.text}
                style={{ width: '25px', height: '25px', marginRight: '10px' }}
              />
              <Typography variant="body2">{day.day.avgtemp_c} °C</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
              <WaterIcon sx={{ marginRight: '10px' }} />
              <Typography variant="body2">Feuchtigkeit: {day.day.avghumidity} %</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
              <AirIcon sx={{ marginRight: '10px' }} />
              <Typography variant="body2">Wind: {day.day.maxwind_kph} km/h</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 1 }}>
              <WbSunnyIcon sx={{ marginRight: '10px' }} />
              <Typography variant="body2">UV-Index: {day.day.uv}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UmbrellaIcon sx={{ marginRight: '10px' }} />
              <Typography variant="body2">Niederschlagswahrscheinlichkeit: {day.day.daily_chance_of_rain} %</Typography>
            </Box>
          </CardContent>
        </Card>
      )
    )}
  </Box>
)}


   
        <BottomNavigation
          value={value}
          onChange={(event, newValue) => {
            setValue(newValue);
            if (newValue === 2 && !isLocationSet) { 
              getCurrentLocation(); 
            }
          }}
          showLabels 
          sx={{
            width: '100%',
            position: 'fixed',
            bottom: 0,
            left: 0,
            backgroundColor: '#1c1c1c',
            color: 'white',
          }}
        >
  


<BottomNavigationAction
            label="Verlauf"
            icon={<RestoreIcon />}
            onClick={handleMenuClick} 
          />
          <BottomNavigationAction 
            label="Favoriten" 
            icon={<FavoriteIcon />} 
            sx={{ color: 'white' }} 
          />
        <BottomNavigationAction 
  label="Standort abrufen" 
  icon={<LocationOnIcon />} 
  sx={{ 
    color: isLocationSet ? 'grey' : 'white', 
    '&:hover': {
      color: isLocationSet ? 'grey' : 'white', 
    },
    '&.Mui-focusVisible': {
      color: isLocationSet ? 'grey' : 'white', 
      outline: 'none', 
      boxShadow: 'none', 
    },
    '&:active': {
      color: isLocationSet ? 'grey' : 'white', 
    },  '&.Mui-selected': {
      color: 'grey', 
      '&:hover': {
        color: 'grey',
      },
    },
  }} 
  disabled={isLocationSet} 
/>

        </BottomNavigation>
        {livestreamError && (
  <p style={{ color: 'red', position: 'fixed', top: 1000, left: '50%', transform: 'translateX(-50%)', zIndex: 2 }}>
    {livestreamError}
  </p>
)}
   <Menu
  anchorEl={anchorEl}
  open={open}
  onClose={handleMenuClose}
  getcontentanchorel={null}  
  anchorOrigin={{
    vertical: 'top',
    horizontal: 'center',
  }}
  transformOrigin={{
    vertical: 'bottom',
    horizontal: 'center',
  }}
  PaperProps={{
    sx: {
      mt: -0.5, 
    },
  }}
>
  {history.length > 0 ? (
    history.map((item, index) => (
      <MenuItem key={index} onClick={handleMenuClose} >
        {item}
      </MenuItem>
    ))
  ) : (
    <MenuItem disabled>Keine Verlaufseinträge</MenuItem>
  )}
</Menu>
      </div>
    </ThemeProvider>
  );
}

export default App;
