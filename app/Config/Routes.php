<?php

use CodeIgniter\Router\RouteCollection;

/**
 * @var RouteCollection $routes
 */
$routes->get('/', 'Person::index');
$routes->get('/family', 'Family::index');
$routes->get('/person', 'Person::index');
