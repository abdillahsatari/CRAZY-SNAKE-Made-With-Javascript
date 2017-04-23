  

    $(document).ready(function() {  
        var canvas = $("#canvas")[0];  
        var ctx = canvas.getContext("2d");  
        var w = $("#canvas").width();  
        var h = $("#canvas").height();  
  
        var cw = 10;  
        var d;  
        var food;  
        var score;  
  
        var snake_array; //membuat cell aray untuk membuat ular  
  
            function init()
                {  
                    d = "right"; //default direction  
                    create_snake();  
                    create_food(); //membuat makanan untuk ular  
                    //score game  
                    score = 0;  

                    if (typeof game_loop != "undefined")  
                    clearInterval(game_loop);  
                    game_loop = setInterval(paint, 60);  
                }  

                init();  
  
            function create_snake()  
                {  
                    var length = 5; //panjang ular default  
                    snake_array = [];   
                    for (var i = length - 1; i >= 0; i--)  
                    {  
                        //membuat ular horizontal mulai dari arah kiri  
                        snake_array.push({x: i, y: 0});  
                    }  
                }  
  
                //membuat makanan  
                function create_food()  
                {  
                    food = {  
                        x: Math.round(Math.random() * (w - cw) / cw),  
                        y: Math.round(Math.random() * (h - cw) / cw),  
                    };  
                }  
  
                //Mewarnai tubuh ular  
                function paint()  
                {  
                    ctx.fillStyle = "green";  
                    ctx.fillRect(0, 0, w, h);  
                    ctx.strokeStyle = "black";  
                    ctx.strokeRect(0, 0, w, h);  
  
                    //Membuat pergerakan untuk ular.  
                    var nx = snake_array[0].x;  
                    var ny = snake_array[0].y;  
                    if (d == "right")  
                        nx++;  
                    else if (d == "left")  
                        nx--;  
                    else if (d == "up")  
                        ny--;  
                    else if (d == "down")  
                        ny++;  
                      
                    //Cek tabakan tembok  
                    if (nx == -1 || nx == w / cw || ny == -1 || ny == h / cw || check_collision(nx, ny, snake_array))  
                    {  
                       //restart game  
                        init();  
                        return;  
                    }  
                      
                    //Cek tabrakan dengan makanan  
                    if (nx == food.x && ny == food.y)  
                    {  
                        var tail = {x: nx, y: ny};  
                        score++;  
                        //membuat makanan baru  
                        create_food();  
                    }  
                    else  
                    {  
                        var tail = snake_array.pop();   
                        tail.x = nx;  
                        tail.y = ny;  
                    }  
  
                    snake_array.unshift(tail);   
  
                    for (var i = 0; i < snake_array.length; i++)  
                   {  
                        var c = snake_array[i];  
                        paint_cell(c.x, c.y);  
                    }  
  
                    //Mewarnai makanan  
                    paint_cell(food.x, food.y);  
                    //Mewarnai score game  
                    var score_text = "Score: " + score;  
                    ctx.fillText(score_text, 5, h - 5);  
                }  
  
                function paint_cell(x, y)  
                {  
                    ctx.fillStyle = "white";  
                    ctx.fillRect(x * cw, y * cw, cw, cw);  
                    ctx.strokeStyle = "white";  
                    ctx.strokeRect(x * cw, y * cw, cw, cw);  
                }  
  
                function check_collision(x, y, array)  
                {  
                    for (var i = 0; i < array.length; i++)  
                    {  
                        if (array[i].x == x && array[i].y == y)  
                            return true;  
                    }  
                    return false;  
                }  
  
                //Keyboard control ular  
                $(document).keydown(function(e) {  
                    var key = e.which;  
                    if (key == "37" && d != "right")  
                        d = "left";  
                    else if (key == "38" && d != "down")  
                        d = "up";  
                    else if (key == "39" && d != "left")  
                        d = "right";  
                    else if (key == "40" && d != "up")  
                        d = "down";  
                })  
            })  
  
