<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Person::index');
$routes->get('/family', 'Family::index');
$routes->get('/person', 'Person::index');
$routes->get('/zone', 'Zone::index');
