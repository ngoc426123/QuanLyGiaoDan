<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->get('/family', 'Family::index');
$routes->post('/family/create', 'Family::create');
$routes->post('/family/(:num)/delete', 'Family::delete/$1');
$routes->get('/family/(:num)/members', 'Family::members/$1');
$routes->post('/family/(:num)/remove-member/(:num)', 'Family::removeMember/$1/$2');
$routes->get('/family/(:num)/search-people', 'Family::searchPeople/$1');
$routes->post('/family/(:num)/add-member', 'Family::addMember/$1');
$routes->get('/person', 'Person::index');
$routes->post('/person/create', 'Person::create');
$routes->get('/person/families', 'Person::families');
$routes->get('/person/(:num)', 'Person::detail/$1');
$routes->post('/person/(:num)/delete', 'Person::delete/$1');
$routes->post('/person/(:num)/update', 'Person::update/$1');

$routes->get('/zone', 'Zone::index');

$routes->get('/overview', 'Overview::index');
$routes->get('/import-export', 'ImportExport::index');

// Setup (initial installation)
$routes->get('setup', 'Setup::index');
$routes->post('setup/install', 'Setup::install');

// Dev-only reset endpoint (development environment only)
$routes->get('dev/reset-setup', 'DevReset::index');
