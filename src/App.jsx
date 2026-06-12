// COMPONENTE PRINCIPAL: App
import './App.css';
import Sidebar from './Sidebar'; 
import ChatArea from './ChatArea';

function App() {
  return (
    <div className='app-container'>
      {/* Mitad izquierda: Menú e historial */}
      <Sidebar />
      {/* Mitad derecha: El terreno de juego */}
      <ChatArea />
    </div>
  )
}

export default App;