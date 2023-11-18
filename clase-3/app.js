const express = require("express");
const crypto = require("node:crypto");
const jsonMovies = require("./movies.json");
const { validateMovie, validatePartialMovie } = require("./schemas/movies");

const app = express();
app.use(express.json());
//SE PUEDE INSTALAR UN MIDDELWARE DE CORS CON NPM I CORS PERO ES MEJOR ENTENDER EL PORQUE, AUNQUE SE PUEDE CONFIGURAR TAMBIEN
app.disable("x-powered-by");
const PORT = process.env.PORT ?? 1234;

const ACCEPTED_ORIGIN = [
  "http://localhost:8080",
  "http://localhost:1234",
  "http://movies.com",
  "http://kawa.dev",
];

app.get("/", (req, res) => {
  res.json({ message: "Meloski!" });
});

app.get("/movies", (req, res) => {
  const origin = req.header("origin");
  //nunca envia el header de origin cuando esta en el mismo dominio'origen'
  if (ACCEPTED_ORIGIN.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  const { year } = req.query;
  if (year) {
    const movies = jsonMovies.filter(({ year }) => year === Number(year));
    if (movies) return res.json(movies);
    return res.status(404).json({ message: "Movie Not Found" });
  }
  res.json(jsonMovies);
});

app.get("/movies/:id", (req, res) => {
  const { id: idParams } = req.params;
  const movie = jsonMovies.find(({ id }) => id === idParams);
  if (movie) return res.json(movie);

  return res.status(404).json({ message: "Movie not found" });
});

app.post("/movies", (req, res) => {
  const result = validateMovie(req.body);
  if (result.error) {
    return res.status(400).json({ error: JSON.parse(result.error.message) });
  }

  const newMovie = {
    id: crypto.randomUUID(),
    ...result.data,
  };

  jsonMovies.push(newMovie);

  res
    .status(201)
    .json({ messega: "Movie created successfully!!", movieAdded: newMovie });
});

app.patch("/movies/:id", (req, res) => {
  const result = validatePartialMovie(req.body);
  if (!result.success) {
    return res.status(404).json({ error: JSON.parse(result.error.message) });
  }
  const { id } = req.params;
  const movieIndex = jsonMovies.findIndex((movie) => movie.id === id);
  if (movieIndex === -1)
    return res.status(404).json({ message: "Movie is not found" });

  const updateMovie = {
    ...jsonMovies[movieIndex],
    ...result.data,
  };

  jsonMovies[movieIndex] = updateMovie;

  return res.json(updateMovie);
});

// métodos normales: GET/HEAD/POST
// métodos complejos: PUT/PATCH/DELETE

// CORS PRE-Flight
// OPTIONS
app.delete("/movies/:id", (req, res) => {
  const origin = req.header("origin");
  if (ACCEPTED_ORIGIN.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  const { id } = req.params;
  const movieIndex = jsonMovies.findIndex((movie) => movie.id === id);
  if (movieIndex === -1)
    return res.status(404).json({ message: "Movie not found!" });

  jsonMovies.splice(movieIndex, 1);

  return res.json({ message: "Movie deleted" });
});

app.options("/movies/:id", (req, res) => {
  const origin = req.header("origin");
  if (ACCEPTED_ORIGIN.includes(origin) || !origin) {
    res.header("Access-Control-Allow-Origin", origin);
    res.header("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,PATCH");
  }
  res.send(200);
});

app.listen(PORT, () => {
  console.info(`server listening on port http://localhost:${PORT}`);
});
