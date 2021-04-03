function NotEmpty(value, name){
    if (!value || value.length ===0){
        throw name + " should be provided"
    }
}

export {NotEmpty}