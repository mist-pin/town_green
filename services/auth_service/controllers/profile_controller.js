// private profile 

const { json } = require("express");
const { pg_query } = require("../../../utils/pg_db_utils");

// local utility:
async function get_db_user_info(req) {
    const user = req.body.user
    const user_info = await pg_query("select * from user_info where user_id=$1", [user.id])
    if (user_info.rows.lenght > 0) {
        return user_info.rows[0]
    } else {
        return null
    }
}

// get: /profile authorized
const get_private_profile = async (req, res) => {
    try {
        // fetch the user_info if exists
        const user_info = await get_db_user_info(req)
        if (!user_info) {
            return res.status(400).json({ message: "no user info found" });
        }
        return res.json({
            username: user_info.user_name,
            dob: user_info.dob,
            ph_no: user_info.ph_no,
            address: user_info.address,
            dp:user_info.dp,
            last_updated: user_info.updated_at
        })
    } catch (err) {
        console.log(err);
        return json.status(500).json({ message: err })
    }
}


// put: /profile
// mw: authorise, multer
// format: req.body.user_info{key:value}
const put_private_profile = async (req, res) => {
    try {
        const new_info = req.body.user_info
        const keys = [], values = []

        // fetch the user_info if exists
        const user_info = await get_db_user_info(req)
        
        const dpPath = req.file ? `/uploads/dps/${req.file.filename}` : null;
        // let the username be unique
        if (new_info.username) {
            const u_name_exists = await pg_query("select * from user_info where user_name = $1", [new_info.username])
            if (u_name_exists.rows.lenght > 0) {
                return res.status(450).json({message:'username already exists'})
            }
        }
        
        Object.keys(new_info).forEach(key => {
            if (new_info[key] !== '') {
                keys.push(key)
                values.push(new_info[key])
            }
        });
        
        if(dpPath){
            keys.push('dp')
            values.push(dpPath)
        }
        
        // create new user info
        if (!user_info) {
            const created_user_info = await pg_query(`insert into user_info(${keys}) values(${values})`)
            if(created_user_info.rowCount<=0){
                return res.status(500).json({message: 'could not create user info'})
            }
        }
        // update existing user info
        else{
            const updated_user_info = await pg_query(`udpate user_info set(${keys}) values(${values})`)
            if(updated_user_info.rowCount<=0){
                return res.status(500).json({message: 'could not update user info'})
            }
        }
        return res.json('information updated successfully')

    } catch (err) {
        console.log(err);
        return json.status(500).json({ message: err })
    }
}

// get: /profile/dp/:id
// mw: authorize
const get_dp = async (req, res) => {

}







// public profile

// get: /profile/:id
const get_public_profile = async () => {

}



module.exports = {
    get_private_profile, put_private_profile,
    get_dp,
    get_public_profile
}