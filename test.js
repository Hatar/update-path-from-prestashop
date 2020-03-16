


var work = function(x)
{

    x()
};



work(function () {
    console.log('salam1')
    console.log('salam2')
    console.log('salam3');
    return 5;
});
