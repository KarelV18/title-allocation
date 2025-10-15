class SweetAlert {
    static success(message, title = 'Success!') {
        return Swal.fire({
            icon: 'success',
            title: title,
            text: message,
            timer: 3000,
            showConfirmButton: false
        });
    }

    static error(message, title = 'Error!') {
        return Swal.fire({
            icon: 'error',
            title: title,
            text: message
        });
    }

    static warning(message, title = 'Warning!') {
        return Swal.fire({
            icon: 'warning',
            title: title,
            text: message
        });
    }

    static info(message, title = 'Info') {
        return Swal.fire({
            icon: 'info',
            title: title,
            text: message
        });
    }

    static confirm(title = 'Are you sure?', text = "You won't be able to revert this!") {
        return Swal.fire({
            title: title,
            text: text,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Yes, proceed!',
            cancelButtonText: 'Cancel'
        });
    }

    static loading(title = 'Loading...') {
        return Swal.fire({
            title: title,
            allowEscapeKey: false,
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
    }

    static close() {
        Swal.close();
    }
}