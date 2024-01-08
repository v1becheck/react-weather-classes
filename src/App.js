import React from 'react';

class App extends React.Component {
  render() {
    return (
      <div>
        <h1>Classy Weather</h1>
        <div>
          <input type='text' placeholder='City, Country' />
        </div>
      </div>
    );
  }
}

export default App;
