import { useState, useRef, useEffect, useCallback } from 'react';
// Asegúrate de tener el archivo Mensaje.jsx en la misma carpeta
import Mensaje from './Mensaje';

function ChatArea() {
  const [textoInput, setTextoInput] = useState("");
  const [escuchando, setEscuchando] = useState(false);
  const [listaMensajes, setListaMensajes] = useState([
    { 
      rol: "ia", 
      texto: "Saludos. Soy el Historiador del Fútbol Mundial. ¿Qué dato o leyenda deseas verificar hoy? Dime 'para' en cualquier momento si deseas silenciarme." 
    }
  ]);

  const cajaMensajesRef = useRef(null);
  const reconocimientoVozRef = useRef(null);

  useEffect(() => {
    if (cajaMensajesRef.current) {
      cajaMensajesRef.current.scrollTop = cajaMensajesRef.current.scrollHeight;
    }
  }, [listaMensajes]);

  // 🔊 SÍNTESIS DE VOZ
  const hablarRespuesta = useCallback((texto) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel(); 
    
    const textoLimpio = texto.replace(/[*#]/g, ''); 
    const enunciado = new SpeechSynthesisUtterance(textoLimpio);
    enunciado.lang = 'es-ES'; 
    enunciado.rate = 1.05;    
    enunciado.pitch = 1.0;   
    window.speechSynthesis.speak(enunciado); 
  }, []);

  // 🎙️ RECONOCIMIENTO DE VOZ SEGURO Y CONTINUO
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const rec = new SpeechRecognition();
    // CORRECCIÓN: 'true' evita que el micrófono se te cierre a la primera pausa
    rec.continuous = true; 
    rec.interimResults = false;
    rec.lang = 'es-ES';

    rec.onstart = () => setEscuchando(true);
    rec.onend = () => setEscuchando(false);
    rec.onerror = (evento) => {
      console.error("Error en el micrófono:", evento.error);
      setEscuchando(false);
    };

    rec.onresult = (evento) => {
      if (!evento.results || evento.results.length === 0) return;
      
      // Obtenemos siempre el último resultado detectado
      const indiceActual = evento.resultIndex;
      const resultadoTexto = evento.results[indiceActual][0].transcript.trim();
      const comando = resultadoTexto.toLowerCase();

      if (comando === "para" || comando === "detente" || comando === "silencio") {
        if ('speechSynthesis' in window) window.speechSynthesis.cancel();
        setTextoInput("");
        return;
      }
      
      // Acumulamos el texto si hablas con pausas
      setTextoInput(prev => prev ? `${prev} ${resultadoTexto}` : resultadoTexto);
    };

    reconocimientoVozRef.current = rec;
    return () => {
      if (reconocimientoVozRef.current) reconocimientoVozRef.current.abort();
    };
  }, []);

  const controlarMicrofono = () => {
    if (!reconocimientoVozRef.current) return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    if (escuchando) {
      reconocimientoVozRef.current.stop();
    } else {
      reconocimientoVozRef.current.start();
    }
  };

  const manejarImagenLocal = (evento) => {
    const archivo = evento.target.files[0];
    if (!archivo) return;
    setListaMensajes(lista => [
      ...lista,
      { rol: "usuario", texto: "Muestra analítica visual adjunta.", imagen: URL.createObjectURL(archivo) }
    ]);
  };

  // ⚙️ CONEXIÓN API BLINDADA CONTRA CRASHEOS
  const manejarEnvio = async (evento) => {
    if (evento) evento.preventDefault(); // Evita que la página se recargue (otro motivo de "cierre")
    if (textoInput.trim() === "") return;

    const promptUsuario = textoInput;

    if (promptUsuario.toLowerCase() === "para" || promptUsuario.toLowerCase() === "detente") {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      setTextoInput("");
      return;
    }

    setListaMensajes(lista => [...lista, { rol: "usuario", texto: promptUsuario }, { rol: "ia", texto: "Buscando en el archivo histórico..." }]);
    setTextoInput(""); 

    try {
      const API_KEY = import.meta.env.VITE_GROQ_API_KEY;
      const URL_API = "https://api.groq.com/openai/v1/chat/completions";

      const respuesta = await fetch(URL_API, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": "Bearer " + API_KEY 
        },
        body: JSON.stringify({
          model: "llama-3.1-8b-instant", 
          messages: [
            { 
              role: "system", 
              content: "Eres el mejor historiador de fútbol del mundo. Datos exactos de Mundiales, Champions y leyendas. Respuestas súper cortas de máximo 2 oraciones directas. Si piden fotos, escribe '[MOSTRAR_IMAGEN]' al final." 
            },
            { role: "user", content: promptUsuario }
          ],
          temperature: 0.2
        })
      });

      const datos = await respuesta.json();
      
      if (!respuesta.ok) {
          throw new Error(datos.error?.message || "Error en el servidor");
      }

      // CORRECCIÓN CRÍTICA: Previene el TypeError si la API devuelve algo inesperado
      if (!datos.choices || !datos.choices[0]?.message?.content) {
          throw new Error("Estructura de respuesta inválida desde Groq.");
      }

      let textoIA = datos.choices[0].message.content;
      let imagenRespuesta = null;
      
      if (textoIA.includes("[MOSTRAR_IMAGEN]") || promptUsuario.toLowerCase().match(/(muestra|foto|imagen|ver)/)) {
        textoIA = textoIA.replace("[MOSTRAR_IMAGEN]", "").trim();
        const consulta = promptUsuario.toLowerCase();
        
        if (consulta.includes("messi")) {
          imagenRespuesta = "https://images.unsplash.com/photo-1626025437642-0b05076ca301?auto=format&fit=crop&w=500&q=80";
        } else if (consulta.includes("maradona") || consulta.includes("argentina")) {
          imagenRespuesta = "https://images.unsplash.com/photo-1518063319789-7217e6706b04?auto=format&fit=crop&w=500&q=80";
        } else if (consulta.includes("pelé") || consulta.includes("brasil")) {
          imagenRespuesta = "https://images.unsplash.com/photo-1568194157720-8eae79a944fc?auto=format&fit=crop&w=500&q=80";
        } else {
          imagenRespuesta = "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=500&q=80";
        }
      }

      setListaMensajes((listaActual) => {
        const listaSinPensando = listaActual.slice(0, -1);
        return [...listaSinPensando, { rol: "ia", texto: textoIA, imagen: imagenRespuesta }];
      });

      hablarRespuesta(textoIA);

    } catch (error) {
      console.error("Error capturado:", error);
      setListaMensajes((listaActual) => {
        const listaSinPensando = listaActual.slice(0, -1);
        return [...listaSinPensando, { rol: "ia", texto: "Error al consultar los registros. Verifica tu conexión o clave de API." }];
      });
    }
  };

  return (
    <main className="chat-area">
      <header className="chat-header">
        <h3>BIBLIOTECA HISTÓRICA DEL FÚTBOL MUNDIAL</h3>
      </header>
      
      <section className="mensajes-container" ref={cajaMensajesRef}>
        {listaMensajes.map((msg, indice) => (
          <Mensaje 
            key={indice} 
            rol={msg.rol} 
            texto={msg.texto} 
            imagen={msg.imagen}
          />
        ))}
      </section>

      <footer className="input-area">
        <form className="chat-form" onSubmit={manejarEnvio}>
          <label htmlFor="input-file-imagen" style={{ cursor: 'pointer', padding: '0 8px', fontSize: '1.3rem' }}>
            📷
            <input type="file" id="input-file-imagen" accept="image/*" style={{ display: 'none' }} onChange={manejarImagenLocal} />
          </label>

          <button 
            type="button" 
            onClick={controlarMicrofono}
            style={{ background: 'none', padding: '0 8px', fontSize: '1.3rem', border: 'none', cursor: 'pointer', color: escuchando ? '#10B981' : '#E2E8F0' }}
          >
            {escuchando ? "🛑" : "🎙️"}
          </button>

          <input
            type="text"
            placeholder={escuchando ? "Escuchando... di 'para' para silenciar" : "Haz tu pregunta corta..."}
            autoComplete="off"
            value={textoInput}
            onChange={(evento) => setTextoInput(evento.target.value)}
          />
          <button type="submit">Consultar</button>
        </form>
      </footer>
    </main>
  );
}

export default ChatArea;