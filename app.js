var express = require('express');
var mysql = require('mysql');
var cors = require('cors');
var multer = require('multer');
var path = require('path');
var WebSocket = require('ws');

var app = express();
app.use(express.json());
app.use(cors());



//  Especiica el origen exacto (recomendado para producción)
var corsOptions = {
    origin: 'http://localhost:5173',  // Asegúrate que este sea el puerto y protocolo donde se ejecuta tu cliente Vue.js
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// parametros para la conexion
var conexion = mysql.createConnection({
    host: 'localhost',
    user:'root',
    password:'',
    database:'marketing_db'
});


const wss = new WebSocket.Server({ port: 8080 });
wss.on('connection', ws => {
    ws.on('message', message => {
      // Cuando se recibe un mensaje, reenviar a todos los clientes conectados
      wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    });
  });

// probamos la conexion
conexion.connect(function(error){
if(error)
    {
        throw error;
    }else{
        console.log("La conexión a la base de datos es exitosa");
    }
});


app.get('/', function(req, res){
    res.send('ruta INICIO')
})

// mostrar todos las programas
app.get('/api/programas',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.programas;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos las profesiones
app.get('/api/profesiones',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.profesiones;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos las institucion de egreso
app.get('/api/institucion_egreso',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.institucion_egreso;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos los grados academicos
app.get('/api/grado_academico',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.grado_academico;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos los grados academicos
app.get('/api/grado_academico',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.grado_academico;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// mostrar todos las ciudades de residencia
app.get('/api/ciudad_residencia',(req,res) =>{
    conexion.query('SELECT * FROM marketing_db.ciudad_residencia;', (error, filas)=>{
        if(error){
            throw error;
        }else{
            res.send(filas);
        }
    })
})

// Muestra todas las inscripciones con detalles de persona y programa
app.get('/api/inscripciones_persona', (req, res) => {
    const sql = `
    SELECT 
            p.num_doc,
            p.nombres,
            p.apellidos,
            p.genero,
            p.fecha_nac,
            p.domicilio,
            p.telefono,
            p.correo,
            cr.nombre_ciudad AS ciudad_residencia,
            ga.grado_academico AS grado_academico,
            ie.nombre_institucion AS institucion_egreso,
            pr.nombre_profesion AS profesion,
            pg.Nombre AS programa,
            ins.fecha_reg,
            ins.cod_asesor
    FROM 
        marketing_db.persona p
    JOIN 
        marketing_db.inscripciones ins ON p.cod_persona = ins.cod_persona
    JOIN 
        marketing_db.ciudad_residencia cr ON p.cod_ciudad_r = cr.cod_ciudad_r
    JOIN 
        marketing_db.programas pg ON ins.Cod_Programa = pg.Cod_Programa
    JOIN 
        marketing_db.grado_academico ga ON p.cod_grado_a = ga.cod_grado_a
    JOIN 
        marketing_db.institucion_egreso ie ON p.cod_institucion_e = ie.cod_institucion_e
    JOIN 
        marketing_db.profesiones pr ON p.cod_profesion = pr.cod_profesion;
    `;
    conexion.query(sql, (error, filas) => {
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        } else {
            res.send(filas);
        }
    });
});

// Muestra todas las inscripciones por programa con detalles de persona
app.get('/api/inscripciones_por_programa', (req, res) => {
    const codPrograma = req.query.Cod_Programa;
    if (!codPrograma) {
        return res.status(400).send('Falta el parámetro Cod_Programa');
    }
    const sql = `
    SELECT 
            p.num_doc,
            p.nombres,
            p.apellidos,
            p.genero,
            p.fecha_nac,
            p.domicilio,
            p.telefono,
            p.correo,
            cr.nombre_ciudad AS ciudad_residencia,
            ga.grado_academico AS grado_academico,
            ie.nombre_institucion AS institucion_egreso,
            pr.nombre_profesion AS profesion,
            pg.Nombre AS programa,
            ins.fecha_reg,
            ins.cod_asesor
    FROM 
        marketing_db.persona p
    JOIN 
        marketing_db.inscripciones ins ON p.cod_persona = ins.cod_persona
    JOIN 
        marketing_db.ciudad_residencia cr ON p.cod_ciudad_r = cr.cod_ciudad_r
    JOIN 
        marketing_db.programas pg ON ins.Cod_Programa = pg.Cod_Programa
    JOIN 
        marketing_db.grado_academico ga ON p.cod_grado_a = ga.cod_grado_a
    JOIN 
        marketing_db.institucion_egreso ie ON p.cod_institucion_e = ie.cod_institucion_e
    JOIN 
        marketing_db.profesiones pr ON p.cod_profesion = pr.cod_profesion
         where pg.Cod_Programa = ?;
    `;
    conexion.query(sql, [codPrograma], (error, filas) => { // Pasar codPrograma como parámetro

        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        } else {
            res.send(filas);
        }
    });
});


// Subir los archivos
// Configuración de Multer(ruta del archivo)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/'); // Directorio donde se almacenan los archivos
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
      }
  });
  
var upload = multer({ storage: storage });

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Subir imagen y guardar en fondo_programa
app.post('/api/upload', upload.single('file'), (req, res) => {
    const { originalname, mimetype, size, filename } = req.file;
    const ruta = `/uploads/${filename}`;
    
    const query = 'INSERT INTO fondo_programa (Nombre_F, Ruta, Tipo, Tamano) VALUES (?, ?, ?, ?)';
    conexion.query(query, [originalname, ruta, mimetype, size], (error, results) => {
      if (error) {
        throw error;
      } else {
        res.send({ message: 'Imagen subida con éxito', id: results.insertId });
      }
    });
  });

  // Crear programa y asociar con imagen portada
  app.post('/api/programas', (req, res) => {
    const { nombre, fondoId } = req.body;
    
    const query = 'INSERT INTO programas (Nombre, Cod_Fondo_P) VALUES (?, ?)';
    conexion.query(query, [nombre, fondoId], (error, results) => {
      if (error) {
        throw error;
      } else {
        res.send({ message: 'Programa creado con éxito', id: results.insertId });
      }
    });
  });

  
// Busca la portada del programa
app.get('/api/portada_programa', (req, res) => {
    const codPrograma = req.query.Cod_Programa;
    if (!codPrograma) {
        return res.status(400).send('Falta el parámetro Cod_Programa');
    }
        const sql = `SELECT 
                p.Nombre,
                fp.*
                FROM 
                marketing_db.programas p
                JOIN 
                    marketing_db.fondo_programa fp
                ON 
                    p.Cod_Fondo_P = fp.Cod_Fondo_P
                WHERE 
                    p.Cod_Programa = ?
                ORDER BY 
                    fp.Cod_Fondo_P DESC
                LIMIT 1;`;
    conexion.query(sql, [codPrograma], (error, result) => { // Pasar codPrograma como parámetro
        if (error) {
            console.error('Error al consultar la base de datos:', error);
            return res.status(500).send('Error interno del servidor');
        }
        if (result.length > 0) {
            res.send(result[0]);
        } else {
            res.status(404).send('No se encontró la portada del programa');
        }
    });
});


/* Permite que las imágenes almacenadas en el directorio uploads puedan ser accedidas 
desde cualquier origen y configura el CORS*/
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
    setHeaders: (res, path, stat) => {
        res.set('Access-Control-Allow-Origin', '*');
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
    }
}));

const puerto = process.env.PUERTO || 3000;

app.listen(puerto,function()
{
    console.log("Servidor Ok en puerto:" + puerto);
});