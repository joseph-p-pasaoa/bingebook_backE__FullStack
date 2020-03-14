/*
JOSEPH P. PASAOA
USERS-SHOWS Route Queries | Bingebook (a full-stack binge-facilitating app)
*/


/* DB CONNECTION */
const db = require('../db');


/* QUERIES */
const getAllUserShows = async () => {
  const getQuery = `
    SELECT show_id
        , user_id
        , username
    FROM users_shows
    INNER JOIN users ON (users_shows.user_id = users.id)
    ORDER BY show_id ASC
        , LOWER(username) ASC;
  `;
  return await db.any(getQuery);
}

const getAllShowsOfUser = async (userId) => {
  const getQuery = `
    SELECT users_shows.id
        , show_id
        , title
        , year
        , imdb_id
        , img_url
        , is_top3
        , watch_status
        , (
            SELECT string_agg(name, ', ' ORDER BY name ASC)
            FROM shows_genres
            INNER JOIN genres ON (shows_genres.genre_id = genres.id)
            WHERE shows.id = shows_genres.show_id
        ) AS genres
    FROM users_shows
    INNER JOIN shows ON (users_shows.show_id = shows.id)
    WHERE user_id = $/userId/
    ORDER BY is_top3 DESC
        , users_shows.id ASC;
  `;
  return await db.any(getQuery, { userId });
}

const getOneFullUserShow = async (showId, userId) => {
  try {
    const getQuery = `
      SELECT 
            us.user_id,
            u.username,
            u.avatar_url,
            us.show_id,
            s.title
          , s.year
          , s.imdb_id
          , s.img_url
          , us.is_top3
          , us.watch_status
          , us.id as usershow_id
          , string_agg(g.name, ', ' ORDER BY g.name ASC) as genre_name_list
      FROM users_shows us
      INNER JOIN users u ON (us.user_id = u.id)
      INNER JOIN shows s ON (us.show_id = s.id)
      INNER JOIN shows_genres sg ON (sg.show_id = s.id)
      INNER JOIN genres g ON (g.id = sg.genre_id)
      WHERE us.user_id = 6
          AND us.show_id = 2
      GROUP BY 
      us.user_id
    , u.username
    , u.avatar_url
    , us.show_id
    , s.title
    , s.year
    , s.imdb_id
    , s.img_url
    , us.is_top3
    , us.watch_status
    , us.id;
    `;
    return await db.one(getQuery, { showId, userId });
  } catch (err) {
    if (err.message === "No data returned from the query.") {
      throw new Error(`404__error: No relationship between user.${userId
        } and show.${showId} exists in our database`);
    }
    throw (err);
  }
}

const checkUserShowExists = async (userId, showId) => {
  try {
    const getQuery = `
      SELECT *
      FROM users_shows
      WHERE user_id = $/userId/ AND
          show_id = $/showId/;
    `;
    await db.one(getQuery, { userId, showId });
    return true;
  } catch (err) {
    if (err.message === "No data returned from the query.") {
      return false;
    } else {
      throw (err);
    }
  }
}

const checkIsAlreadyBinging = async (userId, imdbId) => {
  try {
    const getQuery = `
      SELECT *
      FROM users_shows
      JOIN shows ON (users_shows.show_id = shows.id)
      WHERE user_id = $/userId/ AND
          imdb_id = $/imdbId/;
    `;
    await db.one(getQuery, { userId, imdbId });
    return true;
  } catch (err) {
    if (err.message === "No data returned from the query.") {
      return false;
    } else {
      throw (err);
    }
  }
}

const addUserShow = async (bodyObj) => {
  const postQuery = `
    INSERT INTO users_shows (user_id
        , show_id
        , watch_status
    ) VALUES ($/userId/
        , $/showId/
        , $/watchStatus/
    ) RETURNING *;
  `;
  return await db.one(postQuery, bodyObj);
}

const updateUserShow = async ({ userId, showId, watchStatus, isTop3 }) => {
  try {
    let insertArr = [];
    if (watchStatus) {
      insertArr.push(`watch_status = $/watchStatus/`);
    }
    if (isTop3) {
      insertArr.push(`is_top3 = $/isTop3/`);
    }
    const updatesInsert = insertArr.join(', ');
    console.log(updatesInsert);
    const updateQuery = `
      UPDATE users_shows
      SET ${updatesInsert}
      WHERE user_id = $/userId/
          AND show_id = $/showId/
      RETURNING *;
    `;
    return await db.one(updateQuery, { userId, showId, watchStatus, isTop3 });
  } catch (err) {
    if (err.message === "No data returned from the query.") {
      throw new Error(
        `404__error: user.${bodyObj.userId} - show.${bodyObj.showId
          } relationship not found. Please check ids and try again`
      );
    }
    throw (err);
  }
};


/* EXPORT */
module.exports = {
  getAllUserShows,
  getAllShowsOfUser,
  getOneFullUserShow,
  checkUserShowExists,
  checkIsAlreadyBinging,
  addUserShow,
  updateUserShow
}
