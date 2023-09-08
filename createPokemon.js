const fs = require("fs");
const csv = require("csvtojson");
const { faker } = require("@faker-js/faker");

const createPokemon = async () => {
  let totalPokemonsImage = 721;
  let newData = await csv().fromFile("pokemon.csv");
  let index = 0;
  newData = newData.slice(0, totalPokemonsImage).map((pokemon, index) => {
    return {
      id: index + 1,
      name: pokemon.Name,
      types: pokemon.Type2
        ? [pokemon.Type1.toLowerCase(), pokemon.Type2.toLowerCase()]
        : [pokemon.Type1.toLowerCase()],
      url: `https://coderdex-be-tthl.onrender.com/images/${index + 1}.png`,
      description: faker.commerce.productDescription(),
      height: `${faker.number.int({ min: 100, max: 500 })}`,
      weight: `${faker.number.int({ min: 10, max: 200 })}`,
      category: faker.commerce.productMaterial(),
      abilities: faker.commerce.productAdjective(),
    };
  });
  let data = JSON.parse(fs.readFileSync("pokemons.json"));
  data.pokemons = newData;
  fs.writeFileSync("pokemons.json", JSON.stringify(data, null, 2));
};
createPokemon();
