import { Routes, Route } from 'react-router-dom';
import Login from './components/Login';
import PrivateRoute from './components/PrivateRoute';
import Assets from './components/Assets';

function App() {
  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/';
  };

  return (
    <div>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <div>
                <h2>Dashboard</h2>
                <button onClick={handleLogout}>Logout</button>
                <Assets />
              </div>
            </PrivateRoute>
          }
        />
      </Routes>
    </div>
  );
}

export default App;