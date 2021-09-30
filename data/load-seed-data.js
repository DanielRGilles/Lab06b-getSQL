const client = require('../lib/client');
// import our seed data:
const ediblePlants = require('./edible_plants.js');
const usersData = require('./users.js');
const { getEmoji } = require('../lib/emoji.js');

run();

async function run() {

  try {
    await client.connect();

    const users = await Promise.all(
      usersData.map(user => {
        return client.query(`
                      INSERT INTO users (email, hash)
                      VALUES ($1, $2)
                      RETURNING *;
                  `,
        [user.email, user.hash]);
      })
    );
      
    const user = users[0].rows[0];

    await Promise.all(
      ediblePlants.map(ediblePlant => {
        return client.query(`
                    INSERT INTO edible_plants (plantid, name, growzonenumber, wateringinterval, imageurl, edible, description, owner_id)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
                `,
        [ediblePlant.plantId, ediblePlant.name, ediblePlant.growZoneNumber, ediblePlant.wateringInterval, ediblePlant.imageUrl, ediblePlant.edible, ediblePlant.description, user.id]);
      })
    );
    

    console.log('seed data load complete', getEmoji(), getEmoji(), getEmoji());
  }
  catch(err) {
    console.log(err);
  }
  finally {
    client.end();
  }
    
}
