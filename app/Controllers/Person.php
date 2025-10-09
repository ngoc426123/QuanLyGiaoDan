<?php

namespace App\Controllers;

class Person extends BaseController
{
    public function index(): string
    {
        return view('Person');
    }
}
