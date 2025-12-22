Create database Sports_club_app;
use Sports_club_app;
drop database Sports_club_app;
create table club (
	id_club int primary key auto_increment,
	name_club varchar(100) not null,
    city varchar(100) not null,
    postal_code varchar(10) not null,
    discipline varchar(100) not null
);

create table club_contact (
	id_club int primary key,
	telef varchar(15) not null,
    email varchar(100) not null,
	foreign key(id_club) references club (id_club)
);
ALTER TABLE club_contact
ADD UNIQUE (email),
add unique (telef);


create table teams (
	id_team int primary key auto_increment,
    id_club int not null,
    category varchar(100) not null,
	foreign key (id_club) references club (id_club)
);

create table users (
	id_user int primary key auto_increment,
    id_club int not null,
    user_name varchar(50) not null,
    surename1 varchar(50) not null,
    surename2 varchar(50),
    DNI varchar(50) not null,
    email varchar(150),
    telef varchar(15),
    is_minor boolean default false,
    id_socio int,
    passwrd_hash Char(60) not null,
    foreign key (id_club) references club (id_club),
    foreign key (id_socio) references users (id_user)
);
ALTER TABLE users
ADD UNIQUE (email),
add unique (telef),
add unique (DNI);

ALTER TABLE users
ADD COLUMN fecha_nacimiento DATE not null;

create table rol (
	id_rol int primary key auto_increment,
    rol varchar(20) not null
);
ALTER TABLE rol
ADD UNIQUE (rol);


create table user_rol (
	id_user int not null,
    id_rol int not null,
    foreign key (id_user) references users (id_user),
    foreign key (id_rol) references rol (id_rol)
);


create table user_team (
	id_user INT NOT NULL,
    id_team INT NOT NULL,
    id_rol INT NOT NULL,    
    PRIMARY KEY (id_user, id_team, id_rol),
    FOREIGN KEY (id_user) REFERENCES users(id_user),
    FOREIGN KEY (id_team) REFERENCES teams(id_team),
    FOREIGN KEY (id_rol) REFERENCES rol(id_rol)
);
ALTER TABLE user_team
ADD CONSTRAINT uq_team_user UNIQUE (id_team, id_user);

CREATE TABLE matches (
    id_match INT PRIMARY KEY AUTO_INCREMENT,
    id_team INT NOT NULL,      
    opponent_name VARCHAR(150) NOT NULL,
    match_date DATETIME NOT NULL,
    location VARCHAR(150),
    is_home BOOLEAN DEFAULT TRUE,
    CONSTRAINT fk_match_team
	FOREIGN KEY (id_team) REFERENCES teams(id_team)
);
