const fs = require("fs");
const crypto = require("crypto");

const express = require("express");
const router = express.Router();

const pokemonTypes = [
  "bug",
  "dragon",
  "fairy",
  "fire",
  "ghost",
  "ground",
  "normal",
  "psychic",
  "steel",
  "dark",
  "electric",
  "fighting",
  "flyingText",
  "grass",
  "ice",
  "poison",
  "rock",
  "water",
];

//get all pokemons (query: search(name), type)
router.get("/", (req, res, next) => {
  //input validation
  const allowedFilter = ["search", "type"];
  try {
    let { page, limit, ...filterQuery } = req.query;
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 20;
    const filterKeys = Object.keys(filterQuery);
    filterKeys.forEach((key) => {
      if (!allowedFilter.includes(key)) {
        const exception = new Error(`Query ${key} is not allowed`);
        exception.statusCode = 401;
        throw exception;
      }
      if (!filterQuery[key]) delete filterQuery[key];
    });

    //processing logic
    let offset = limit * (page - 1);
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    let result = pokemons;

    if (filterKeys.length) {
      if (filterQuery.search) {
        result = result.filter((pokemon) =>
          pokemon.name.includes(filterQuery.search)
        );
      }
      if (filterQuery.type) {
        result = result.filter((pokemon) =>
          pokemon.types.includes(filterQuery.type)
        );
      }
    }
    result = result.slice(offset, offset + limit);

    //send response
    res.status(200).send({ data: result });
  } catch (error) {
    next(error);
  }
});

//get single pokemon with previous and next pokemon
router.get("/:id", (req, res, next) => {
  //input validation
  try {
    const { id } = req.params;
    // //processing logic
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    if (isNaN(id)) {
      const exception = new Error(`Id must be a number.`);
      exception.statusCode = 401;
      throw exception;
    }

    const targetIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === parseInt(id)
    );
    if (targetIndex < 0) {
      const exception = new Error(`Id not found`);
      exception.statusCode = 404;
      throw exception;
    }
    let result = {
      pokemon: pokemons[targetIndex],
      previousPokemon:
        targetIndex === 0
          ? pokemons[pokemons.length - 1]
          : pokemons[targetIndex - 1],
      nextPokemon:
        targetIndex === pokemons.length - 1
          ? pokemons[0]
          : pokemons[targetIndex + 1],
    };
    //send response
    res.status(200).send({ data: result });
  } catch (error) {
    next(error);
  }
});

//create new pokemon
router.post("/", (req, res, next) => {
  try {
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    //post input validation
    let {
      name,
      id,
      types,
      url,
      description,
      height,
      weight,
      category,
      abilities,
    } = req.body;
    if (!name || !id || types[0] === null || !url) {
      const exception = new Error(`Missing required data.`);
      exception.statusCode = 401;
      throw exception;
    }
    //check ID is number
    if (isNaN(id)) {
      const exception = new Error(`Id must be a number.`);
      exception.statusCode = 401;
      throw exception;
    }
    //lowercase
    name = name.toLowerCase();
    types = types.map((type) => type.toLowerCase());

    //check type's length
    if (types.length > 2) {
      const exception = new Error(`No more than two types.`);
      exception.statusCode = 401;
      throw exception;
    }
    //check valid type
    types.forEach((type) => {
      if (!pokemonTypes.includes(type)) {
        const exception = new Error(`Invalid types.`);
        exception.statusCode = 401;
        throw exception;
      }
    });
    //check duplicate name, id
    if (pokemons.find((pokemon) => pokemon.id == id || pokemon.name == name)) {
      const exception = new Error(`Pokemon has already existed.`);
      exception.statusCode = 401;
      throw exception;
    }
    //check valid weight
    if (weight) {
      if (isNaN(weight)) {
        const exception = new Error(`Weight must be a number.`);
        exception.statusCode = 401;
        throw exception;
      }
    }

    //check valid height
    if (height) {
      if (isNaN(height)) {
        const exception = new Error(`Height must be a number.`);
        exception.statusCode = 401;
        throw exception;
      }
    }

    //post processing

    const newPokemon = {
      id: parseInt(id),
      name,
      types,
      url,
      description: description || "",
      height: height || "",
      weight: weight || "",
      category: category || "",
      abilities: abilities || "",
    };

    pokemons.push(newPokemon);
    db.pokemons = pokemons;
    db = JSON.stringify(db, null, 2);
    fs.writeFileSync("pokemons.json", db);

    //post send response
    res.status(200).send(newPokemon);
  } catch (error) {
    next(error);
  }
});

//update pokemon
router.put("/:id", (req, res, next) => {
  try {
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    //put input validation
    const { id } = req.params;
    let { name, types, url, description, height, weight, category, abilities } =
      req.body;
    //check id number
    if (isNaN(id)) {
      const exception = new Error(`Id must be a number.`);
      exception.statusCode = 401;
      throw exception;
    }
    //Check ID exists
    const targetIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === parseInt(id)
    );
    if (targetIndex < 0) {
      const exception = new Error(`Id not found`);
      exception.statusCode = 404;
      throw exception;
    }
    let updatedPokemon = db.pokemons[targetIndex];

    // //lowercase name, types
    name = name?.toLowerCase();
    types = types?.map((type) => type.toLowerCase());

    if (types) {
      //check type's length
      if (types.length > 2) {
        const exception = new Error(`No more than two types.`);
        exception.statusCode = 401;
        throw exception;
      }
      //check valid type
      types.forEach((type) => {
        if (!pokemonTypes.includes(type)) {
          const exception = new Error(`Invalid types.`);
          exception.statusCode = 401;
          throw exception;
        }
      });
      //update types
      updatedPokemon.types = types;
    }

    //check duplicate name
    if (name) {
      if (pokemons.find((pokemon) => pokemon.name == name)) {
        const exception = new Error(`Name has already existed.`);
        exception.statusCode = 401;
        throw exception;
      }
      updatedPokemon.name = name;
    }

    if (url) {
      updatedPokemon.url = url;
    }

    //check valid weight
    if (weight) {
      if (isNaN(weight)) {
        const exception = new Error(`Weight must be a number.`);
        exception.statusCode = 401;
        throw exception;
      }
      updatedPokemon.weight = weight;
    }

    //check valid height
    if (height) {
      if (isNaN(height)) {
        const exception = new Error(`Height must be a number.`);
        exception.statusCode = 401;
        throw exception;
      }
      updatedPokemon.height = height;
    }

    if (description) {
      updatedPokemon.description = description;
    }
    if (category) {
      updatedPokemon.category = category;
    }
    if (abilities) {
      updatedPokemon.abilities = abilities;
    }

    //put processing logic
    db.pokemons[targetIndex] = updatedPokemon;
    db = JSON.stringify(db, null, 2);
    fs.writeFileSync("pokemons.json", db);

    //put send response
    res.status(200).send(updatedPokemon);
  } catch (error) {
    next(error);
  }
});

//delete pokemon
router.delete("/:id", (req, res, next) => {
  try {
    let db = fs.readFileSync("pokemons.json", "utf-8");
    db = JSON.parse(db);
    const { pokemons } = db;

    //delete input validation
    const { id } = req.params;
    //check id number
    if (isNaN(id)) {
      const exception = new Error(`Id must be a number.`);
      exception.statusCode = 401;
      throw exception;
    }
    //Check ID exists
    const targetIndex = pokemons.findIndex(
      (pokemon) => pokemon.id === parseInt(id)
    );
    if (targetIndex < 0) {
      const exception = new Error(`Id not found`);
      exception.statusCode = 404;
      throw exception;
    }
    //delete processing logic
    db.pokemons = pokemons.filter((pokemon) => pokemon.id !== parseInt(id));
    db = JSON.stringify(db, null, 2);
    fs.writeFileSync("pokemons.json", db);

    //delete send response
    res.status(200).send({});
  } catch (error) {
    next(error);
  }
});

module.exports = router;
