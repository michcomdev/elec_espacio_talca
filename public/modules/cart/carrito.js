let internals = {
    productData: []
}

$(document).ready(async function () {
    getCarrito()
})

async function getCarrito() {
    let cartList = JSON.parse(localStorage.getItem('cartIn')) || []

    document.querySelector('#contProducts').innerHTML = /*html*/`
    <div class="row">
        <div id="cartProds" class="col-8">

        </div>
        <div id="buyData" class="col-4 bg-dark text-white" style="margin-top:10px;">

        </div>
    </div>
    `

    document.querySelector('#cartProds').innerHTML = cartList.reduce((acc, el, i) => {
        let auxCart = JSON.parse(localStorage.getItem('cartIn')) || []
        let iconCart = ''

        if (auxCart.some(e => e._id === el._id)) {
            iconCart = '<i class="fas fa-cart-arrow-down"> Quitar</i>'
        } else {
            iconCart = '<i class="fas fa-cart-plus"></i>'
        }

        acc += /*html*/`
        <div class="row bg-dark text-white" style="margin-top:10px">
            <div class="col-8 bg-dark text-white">
                <div class="bg-image col-4">
                    <img src="${el.image}" style="margin:0 auto; position:relative; width:100%; max-height:160px; max-width:160px; margin-top:10px; margin-left:10px;" class="img-fluid"/>
                </div>
                <div class="card-body" style="padding-left:0px">
                    <h5 class="card-title">${el.name}</h5>
                    <p class="card-text">${el.description}</p>
                </div>
                <div>
                    <u>$${new Intl.NumberFormat("de-DE").format(el.price)}</u>
                    <button type="button" id="cartButton" class="btn btn-success cartButton" data-productid="${el._id}" style="float:right">
                        ${iconCart}
                    </button>
                </div>
            </div>
            <div class="col-4">
                <u>$${new Intl.NumberFormat("de-DE").format(el.price)}</u>
            </div>
        </div>






      `
        return acc
    }, '')
}