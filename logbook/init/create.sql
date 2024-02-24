-- --------------------------------------------------------
-- Host:                         localhost
-- Server version:               10.2.10-MariaDB - MariaDB Server
-- Server OS:                    Linux
-- HeidiSQL Version:             11.3.0.6295
-- --------------------------------------------------------

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET NAMES utf8 */;
/*!50503 SET NAMES utf8mb4 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

-- Dumping structure for table passage.api_keys
CREATE TABLE IF NOT EXISTS `api_keys` (
  `token` varchar(250) NOT NULL,
  `expires` datetime NOT NULL,
  `user` varchar(50) NOT NULL,
  `type` varchar(50) NOT NULL,
  PRIMARY KEY (`token`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for table passage.logbook
CREATE TABLE IF NOT EXISTS `logbook` (
  `id` bigint(20) NOT NULL DEFAULT 0,
  `total_distance` float NOT NULL DEFAULT 0 COMMENT 'Nautical Miles',
  `start_location` varchar(50) DEFAULT NULL,
  `start_time` datetime DEFAULT NULL,
  `start_timezone` varchar(50) DEFAULT NULL,
  `end_location` varchar(50) DEFAULT NULL,
  `end_time` datetime DEFAULT NULL,
  `end_timezone` varchar(50) DEFAULT NULL,
  `weather` text DEFAULT NULL,
  `twighlight_begin` time DEFAULT NULL,
  `twighlight_end` time DEFAULT NULL,
  `comments` text DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for view passage.logbook_entry_track
-- Creating temporary table to overcome VIEW dependency errors
CREATE TABLE `logbook_entry_track` (
	`track_id` INT(11) NOT NULL,
	`logbook_id` BIGINT(20) NOT NULL,
	`uploaded_date` DATETIME NOT NULL,
	`gpx` LONGTEXT NOT NULL COLLATE 'utf8mb4_general_ci',
	`bounds_W` DOUBLE NULL,
	`bounds_E` DOUBLE NULL,
	`bounds_N` DOUBLE NULL,
	`bounds_S` DOUBLE NULL,
	`id` BIGINT(20) NOT NULL,
	`total_distance` FLOAT NOT NULL COMMENT 'Nautical Miles',
	`start_location` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`start_time` DATETIME NULL,
	`start_timezone` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`end_location` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`end_time` DATETIME NULL,
	`end_timezone` VARCHAR(50) NULL COLLATE 'utf8mb4_general_ci',
	`weather` TEXT NULL COLLATE 'utf8mb4_general_ci',
	`twighlight_begin` TIME NULL,
	`twighlight_end` TIME NULL,
	`comments` TEXT NULL COLLATE 'utf8mb4_general_ci'
) ENGINE=MyISAM;

-- Dumping structure for table passage.logbook_tracks
CREATE TABLE IF NOT EXISTS `logbook_tracks` (
  `track_id` int(11) NOT NULL AUTO_INCREMENT,
  `logbook_id` bigint(20) NOT NULL DEFAULT 0,
  `uploaded_date` datetime NOT NULL DEFAULT current_timestamp(),
  `gpx` longtext NOT NULL,
  `bounds_W` double DEFAULT NULL,
  `bounds_E` double DEFAULT NULL,
  `bounds_N` double DEFAULT NULL,
  `bounds_S` double DEFAULT NULL,
  PRIMARY KEY (`track_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Data exporting was unselected.

-- Dumping structure for view passage.logbook_entry_track
-- Removing temporary table and create final VIEW structure
DROP TABLE IF EXISTS `logbook_entry_track`;
CREATE ALGORITHM=UNDEFINED SQL SECURITY DEFINER VIEW `logbook_entry_track` AS select `t`.`track_id` AS `track_id`,`t`.`logbook_id` AS `logbook_id`,`t`.`uploaded_date` AS `uploaded_date`,`t`.`gpx` AS `gpx`,`t`.`bounds_W` AS `bounds_W`,`t`.`bounds_E` AS `bounds_E`,`t`.`bounds_N` AS `bounds_N`,`t`.`bounds_S` AS `bounds_S`,`l`.`id` AS `id`,`l`.`total_distance` AS `total_distance`,`l`.`start_location` AS `start_location`,`l`.`start_time` AS `start_time`,`l`.`start_timezone` AS `start_timezone`,`l`.`end_location` AS `end_location`,`l`.`end_time` AS `end_time`,`l`.`end_timezone` AS `end_timezone`,`l`.`weather` AS `weather`,`l`.`twighlight_begin` AS `twighlight_begin`,`l`.`twighlight_end` AS `twighlight_end`,`l`.`comments` AS `comments` from (`logbook_tracks` `t` join `logbook` `l` on(`l`.`id` = `t`.`logbook_id` and `t`.`uploaded_date` in (select max(`logbook_tracks`.`uploaded_date`) from `logbook_tracks` group by `logbook_tracks`.`logbook_id`)));

/*!40101 SET SQL_MODE=IFNULL(@OLD_SQL_MODE, '') */;
/*!40014 SET FOREIGN_KEY_CHECKS=IFNULL(@OLD_FOREIGN_KEY_CHECKS, 1) */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40111 SET SQL_NOTES=IFNULL(@OLD_SQL_NOTES, 1) */;
