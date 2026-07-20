import { useState } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { supabase } from "./services/supabase";
import Admin from "./pages/Admin";
import "./App.css";

const CARRERAS_POR_FACULTAD = {
  "Facultad de Ciencias Jurídicas": [
    "Licenciatura en Ciencias Jurídicas",
  ],

  "Facultad de Ingeniería y Ciencias Naturales": [
    "Ingeniería Eléctrica",
    "Ingeniería Industrial",
    "Ingeniería en Sistemas Computacionales",
    "Ingeniería en Agronegocios",
    "Técnico en Logística y Aduanas",
    "Técnico Superior en Ciencia de Datos",
  ],

  "Facultad de Economía y Ciencias Sociales": [
    "Licenciatura en Administración de Empresas",
    "Licenciatura en Contaduría Pública",
    "Licenciatura en Mercadeo",
  ],

  "Escuela de Educación": [
    "Licenciatura en Matemática",
    "Licenciatura en Ciencias Naturales",
    "Licenciatura en Lenguaje y Literatura",
    "Licenciatura en Educación Física, Deportes y Recreación",
  ],

  "Facultad de Ciencias de la Salud": [
    "Licenciatura en Psicología",
    "Técnico en Enfermería",
  ],

  Maestrías: [
    "Maestría en Neuropsicología del Aprendizaje",
    "Maestría en Atención Integral de la Primera Infancia",
    "Maestría en Innovación Educativa",
    "Maestría en Administración Financiera",
    "Maestría en Gerencia de Proyectos",
    "Maestría en Administración y Gestión Educativa",
  ],
};

const formularioInicial = {
  nombre: "",
  facultad: "",
  carrera: "",
  telefono: "",
};

function Registro() {
  const [formulario, setFormulario] = useState(formularioInicial);
  const [resultado, setResultado] = useState(null);
  const [cargando, setCargando] = useState(false);
  const [mensajeError, setMensajeError] = useState("");

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormulario((anterior) => ({
      ...anterior,
      [name]: value,
    }));

    setMensajeError("");
  };

  const handleFacultadChange = (e) => {
    const facultadSeleccionada = e.target.value;

    setFormulario((anterior) => ({
      ...anterior,
      facultad: facultadSeleccionada,
      carrera: "",
    }));

    setMensajeError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cargando) return;

    const nombre = formulario.nombre.trim();
    const facultad = formulario.facultad.trim();
    const carrera = formulario.carrera.trim();
    const telefono = formulario.telefono.replace(/\D/g, "");

    if (nombre.length < 3) {
      setMensajeError("Escribe un nombre válido.");
      return;
    }

    if (!facultad) {
      setMensajeError("Selecciona una facultad.");
      return;
    }

    if (!carrera) {
      setMensajeError("Selecciona una carrera.");
      return;
    }

    if (telefono.length < 8) {
      setMensajeError(
        "Escribe un número de teléfono de al menos 8 dígitos."
      );
      return;
    }

    try {
      setCargando(true);
      setMensajeError("");

      const { data, error } = await supabase.rpc(
        "registrar_participante",
        {
          p_nombre: nombre,
          p_facultad: facultad,
          p_carrera: carrera,
          p_telefono: telefono,
        }
      );

      if (error) {
        throw error;
      }

      const registro = Array.isArray(data) ? data[0] : data;

      if (!registro) {
        throw new Error("Supabase no devolvió el registro.");
      }

      setResultado({
        ...registro,
        facultad: registro.facultad || facultad,
      });

      setFormulario(formularioInicial);
    } catch (error) {
      console.error("Error al registrar:", error);

      setMensajeError(
        error?.message ||
          "No se pudo realizar el registro. Intenta nuevamente."
      );
    } finally {
      setCargando(false);
    }
  };

  const nuevoRegistro = () => {
    setResultado(null);
    setMensajeError("");
    setFormulario(formularioInicial);
  };

  if (resultado) {
    const numeroFormateado = String(resultado.numero).padStart(3, "0");

    return (
      <main className="pagina">
        <section className="tarjeta tarjeta-resultado">
          <div className="icono-exito">✓</div>

          <p className="institucion">
            Universidad de Sonsonate
          </p>

          <h1>
            {resultado.ya_existia
              ? "Registro encontrado"
              : "¡Registro completado!"}
          </h1>

          <p className="descripcion">
            {resultado.ya_existia
              ? "Este teléfono ya estaba registrado. Conservas el mismo número."
              : "Presenta este número cuando seas llamado para la fotografía."}
          </p>

          <div className="numero-contenedor">
            <span>Tu número para la fotografía es</span>
            <strong>{numeroFormateado}</strong>
          </div>

          <div className="datos-comprobante">
            <div>
              <span>Nombre</span>
              <strong>{resultado.nombre}</strong>
            </div>

            <div>
              <span>Facultad</span>
              <strong>
                {resultado.facultad || "No especificada"}
              </strong>
            </div>

            <div>
              <span>Carrera</span>
              <strong>{resultado.carrera}</strong>
            </div>

            <div>
              <span>Teléfono</span>
              <strong>{resultado.telefono}</strong>
            </div>
          </div>

          <p className="captura-aviso">
            Este número servirá para organizar el orden de la
            fotografía grupal.
          </p>

          <button type="button" onClick={nuevoRegistro}>
            Realizar otro registro
          </button>
        </section>
      </main>
    );
  }

  const carrerasDisponibles = formulario.facultad
    ? CARRERAS_POR_FACULTAD[formulario.facultad] || []
    : [];

  return (
    <main className="pagina">
      <section className="tarjeta">
        <div className="encabezado">
          <div className="logo-placeholder">USO</div>

          <p className="institucion">
            Universidad de Sonsonate
          </p>

          <h1>Registro para fotografía</h1>

          <p className="descripcion">
            Completa tus datos para recibir tu número de orden para
            la fotografía.
          </p>
        </div>

        <form className="formulario" onSubmit={handleSubmit}>
          <div className="campo">
            <label htmlFor="nombre">Nombre completo</label>

            <input
              id="nombre"
              name="nombre"
              type="text"
              placeholder="Ejemplo: Juan Pérez"
              value={formulario.nombre}
              onChange={handleChange}
              minLength={3}
              maxLength={100}
              autoComplete="name"
              disabled={cargando}
              required
            />
          </div>

          <div className="campo">
            <label htmlFor="facultad">
              Facultad o programa
            </label>

            <select
              id="facultad"
              name="facultad"
              value={formulario.facultad}
              onChange={handleFacultadChange}
              disabled={cargando}
              required
            >
              <option value="">
                Seleccione una facultad
              </option>

              {Object.keys(CARRERAS_POR_FACULTAD).map(
                (facultad) => (
                  <option key={facultad} value={facultad}>
                    {facultad}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="carrera">Carrera</label>

            <select
              id="carrera"
              name="carrera"
              value={formulario.carrera}
              onChange={handleChange}
              disabled={cargando || !formulario.facultad}
              required
            >
              <option value="">
                {formulario.facultad
                  ? "Seleccione su carrera"
                  : "Primero seleccione una facultad"}
              </option>

              {carrerasDisponibles.map((carrera) => (
                <option key={carrera} value={carrera}>
                  {carrera}
                </option>
              ))}
            </select>
          </div>

          <div className="campo">
            <label htmlFor="telefono">
              Número de teléfono
            </label>

            <input
              id="telefono"
              name="telefono"
              type="tel"
              inputMode="numeric"
              placeholder="Ejemplo: 7777-7777"
              value={formulario.telefono}
              onChange={handleChange}
              minLength={8}
              maxLength={15}
              autoComplete="tel"
              disabled={cargando}
              required
            />
          </div>

          {mensajeError && (
            <div className="mensaje-error" role="alert">
              {mensajeError}
            </div>
          )}

          <button type="submit" disabled={cargando}>
            {cargando
              ? "Registrando..."
              : "Obtener mi número"}
          </button>
        </form>

        <p className="aviso">
          Verifica que tus datos estén correctos antes de
          registrarte.
        </p>
      </section>
    </main>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Registro />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;