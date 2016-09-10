<?php
$do = isset($_GET['do']) ? $_GET['do'] : false;


switch ($do) {
	case 'availability':
		$res = file_get_contents("https://reserve.cdn-apple.com/HK/zh_HK/reserve/iPhone/availability.json");
		break;
	
	case 'stores':
		$res = file_get_contents("https://reserve.cdn-apple.com/HK/zh_HK/reserve/iPhone/stores.json");		
		break;
	default:
		$res = [
			'error' => 'no request'
		];
		break;
}
if(!is_array($res)) $res = json_decode($res);
if(json_last_error()) {
	$res = json_encode([
		'error' => json_last_error_msg()
		]);
}

if(!empty($res)) echo_response($res);


function echo_response($res){
	header('Content-Type: application/json');
	$json = json_encode($res);
	$error = json_last_error();
	if($error) $json = json_encode([
		'error' => json_last_error_msg()
		]
	);
	echo $json;
}