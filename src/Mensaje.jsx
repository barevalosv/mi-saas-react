import React from 'react';

const Mensaje = React.memo(function Mensaje(props) {
    const esUsuario = props.role === "usuario" || props.rol === "usuario";
    const claseCSS = esUsuario ? "msg-usuario" : "msg-ia";
    const nombreCaja = esUsuario ? "AFICIONADO" : "EL HISTORIADOR DEL FÚTBOL";

    return (
        <div className={claseCSS}>
            <span style={{ 
                display: 'block', 
                fontSize: '11px', 
                letterSpacing: '0.5px', 
                marginBottom: '4px', 
                fontWeight: 'bold',
                color: esUsuario ? '#F59E0B' : '#10B981' 
            }}>
                {nombreCaja}
            </span>
            
            <p style={{ margin: 0, whiteSpace: 'pre-line' }}>{props.texto}</p>

            {props.imagen && (
                <div style={{ marginTop: '10px' }}>
                    <img 
                        src={props.imagen} 
                        alt="Evidencia histórica" 
                        loading="lazy" 
                        decoding="async"
                        className="media-render"
                        style={{ maxHeight: '240px', objectFit: 'cover', width: '100%' }}
                    />
                </div>
            )}
        </div>
    );
});

export default Mensaje;