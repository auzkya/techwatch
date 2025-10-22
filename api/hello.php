<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // pro React CORS
echo json_encode(["message" => "Backend funguje!"]);
