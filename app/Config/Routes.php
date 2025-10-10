<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Home::index');
$routes->get('/family', 'Family::index');
$routes->get('/person', 'Person::index');

$routes->get('/zone', 'Zone::index');

$routes->get('/overview', 'Overview::index');
$routes->get('/import-export', 'ImportExport::index');
