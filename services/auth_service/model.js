const { pg_query } = require("../../utils/pg_db_utils");

const role_table = `
    create table if not exists role(
        name text primary key,
        permissions text[]
    )`;

const user_table = `
    create table if not exists tg_user(
        id serial primary key,
        mail text unique not null,
        mail_verified boolean default false,
        role text references role(name) default 'user',
        created_at timestamp default now()
    )`;


const google_auth_table = `
    create table if not exists google_auth(
        user_id int references tg_user(id) on delete cascade primary key,
        google_id text unique not null,
        created_at timestamp default now()
    )`;

const user_details_table = `
    create table if not exists user_info(
        user_id int references tg_user(id) on delete cascade primary key,
        password text,
        user_name text unique,
        name text,
        dob date,
        dp text,
        ph_no text,
        address text,
        updated_at timestamp
    )`;

const user_info_trigger = `
    create or replace function update_updated_at_column()
    returns trigger as $$
    begin
        new.updated_at = now();
        return new;
    end;
    $$ language plpgsql;

    do $$
    begin
        if not exists (
            select 1 from pg_trigger 
            where tgname = 'set_updated_at'
        ) then
            create trigger set_updated_at
            before update on user_info
            for each row
            execute function update_updated_at_column();
        end if;
    end $$;

`;

const refresh_token_table = `
    create table if not exists token(
        user_id int references tg_user(id) on delete cascade primary key,
        token text not null,
        google_token text default null,
        created_at timestamp default now()
    )`;

const default_role_exists = `select * from role where name='user'`
const default_role_insert = `insert into role(name,permissions) values('user','{"read"}')`;

async function create(){
    try{
        await pg_query(role_table)
        await pg_query(user_table);
        await pg_query(google_auth_table);
        await pg_query(user_details_table);
        await pg_query(user_info_trigger);
        await pg_query(refresh_token_table);
        const def_role = await pg_query(default_role_exists)
        if (def_role.rows.length <= 0 ){
            await pg_query(default_role_insert);
        }
        console.log('All tables created');
    } catch (error) {
        console.log(error);
    }
}

module.exports = {create}