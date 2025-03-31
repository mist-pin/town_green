require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    "user": process.env.POSTGRES_USER,
    "host": process.env.POSTGRES_HOST,
    "database": process.env.POSTGRES_DB,
    "password": process.env.POSTGRES_PASSWORD,
    "port": process.env.POSTGRES_PORT,
    "max": 20,
});

// pool.on('connect', () => {console.log('connected')});
// pool.on('error', (error) => {console.log('error', error)});

// local utils:
function getFullQuery(query, params) {
    params.forEach((param, index) => {
      query = query.replace(`$${index + 1}`, String(param));
    });
    return query;
}

const pg_query = async(query, params=[])=>{
    try{
        let res = await pool.query(query, params);
        console.info(`---------executed-------\n ${getFullQuery(query,params)}\n--------------\n`
        )
        if(query.toLowerCase().includes("select")){
            return res;
        }else{
            return res.rowCount;
        }
    }catch(error){
        console.error(error);
    }
}

async function get_user_with_mail(mail) {
    let user = await pg_query(`select * from tg_user where mail=$1`, [mail]);
    if (user.rows.length <= 0) {
        return false;
    }
    return user.rows[0];
}

module.exports = {pg_query, get_user_with_mail}
