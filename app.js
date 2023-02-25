const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const app = express();

app.use(express.json());

const dbPath = path.join(__dirname, "cricketMatchDetails.db");

let db = null;
const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

const convertPlayersDbObjToRespObj = (dbz) => {
  return {
    playerId: dbz.player_id,
    playerName: dbz.player_name,
  };
};

const convertMatchDbObjToRespObj = (dbz) => {
  return {
    matchId: dbz.match_id,
    match: dbz.match,
    year: dbz.year,
  };
};

const convertScoreDbObjToRespObj = (dbz) => {
  return {
    playerMatchId: dbz.player_match_id,
    playerId: dbz.player_id,
    matchId: dbz.match_id,
    score: dbz.score,
    fours: dbz.fours,
    sixes: dbz.sixes,
  };
};

//API 1
app.get("/players/", async (request, response) => {
  const dbQuery = `
    SELECT 
        *
    FROM 
        player_details ;`;
  const dbResp = await db.all(dbQuery);
  response.send(dbResp.map((dbz) => convertPlayersDbObjToRespObj(dbz)));
});

//API 2
app.get("/players/:playerId", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `
    SELECT 
        *
    FROM 
        player_details
    WHERE
        player_id = ${playerId};`;
  const dbResp = await db.get(dbQuery);
  response.send(convertPlayersDbObjToRespObj(dbResp));
});

//API 3
app.put("/players/:playerId/", async (request, response) => {
  const { playerId } = request.params;
  const { playerName } = request.body;
  const dbQuery = `
    UPDATE 
        player_details
    SET 
        player_name = '${playerName}'
    WHERE 
        player_id = ${playerId};`;

  const dbResp = await db.run(dbQuery);
  response.send("Player Details Updated");
});

//API 4
app.get("/matches/:matchId/", async (request, response) => {
  const { matchId } = request.params;
  const dbQuery = `
    SELECT 
        *
    FROM 
        match_details
    WHERE
        match_id = ${matchId};`;
  const dbResp = await db.get(dbQuery);
  response.send(convertMatchDbObjToRespObj(dbResp));
});

//API 5
app.get("/players/:playerId/matches", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `
    SELECT 
        match_id,
        match,
        year
    FROM 
        match_details NATURAL JOIN player_match_score
    WHERE 
        player_id = ${playerId};`;
  const dbResp = await db.all(dbQuery);
  response.send(dbResp.map((dbz) => convertMatchDbObjToRespObj(dbz)));
});

//API 6
app.get("/matches/:matchId/players", async (request, response) => {
  const { matchId } = request.params;
  const dbQuery = `
    SELECT
        player_id,
        player_name
    FROM 
        player_details NATURAL JOIN player_match_score
    WHERE 
        match_id = ${matchId};`;
  const dbResp = await db.all(dbQuery);
  response.send(dbResp.map((dbz) => convertPlayersDbObjToRespObj(dbz)));
});

//API 7
app.get("/players/:playerId/playerScores", async (request, response) => {
  const { playerId } = request.params;
  const dbQuery = `
    SELECT 
        player_id,
        player_name,
        SUM(score),
        SUM(fours),
        SUM(sixes)
    FROM 
        player_match_score NATURAL JOIN player_details
    WHERE 
        player_id = ${playerId};`;
  const dbResp = await db.get(dbQuery);
  response.send({
    playerId: dbResp["player_id"],
    playerName: dbResp["player_name"],
    totalScore: dbResp["SUM(score)"],
    totalFours: dbResp["SUM(fours)"],
    totalSixes: dbResp["SUM(sixes)"],
  });
});

module.exports = app;
