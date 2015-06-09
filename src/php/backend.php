<?php
if(!isset($_POST) || !isset($_POST['action']))
{
    exit();
}

define('FILE', '../data/players.json');

class SimpleModel
{
    protected $fileName;
    protected $data;

    public function __construct($pFileName)
    {
        $this->fileName = $pFileName;
        if(!file_exists($this->fileName))
        {
            $this->data = array();
            $this->save();
        }
        $this->data = json_decode(file_get_contents($this->fileName), true);
    }

    public function add($pData)
    {
        $this->data[] = $pData;
    }

    public function delete($pIndex)
    {
        if(!isset($this->data[$pIndex]))
            return;
        unset($this->data[$pIndex]);
    }

    public function save()
    {
        chmod($this->fileName, 0777);
        file_put_contents($this->fileName, json_encode($this->data));
    }

    public function getData()
    {
        return $this->data;
    }
}

class TodoModel extends SimpleModel
{
    public function __construct()
    {
        parent::__construct(FILE);
    }
}

switch($_POST['action'])
{
    case "addTodo":
        $return = array();
        header('Content-Type:application/json');
        echo json_encode($return);
        exit();

        break;
    case "deleteTodo":
        $return = array();
        header('Content-Type:application/json');
        echo json_encode($return);
        exit();
        break;
    default:
        exit();
}