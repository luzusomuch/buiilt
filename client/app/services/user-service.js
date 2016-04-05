angular.module('buiiltApp').factory('userService', function($resource) {
    return $resource('/api/users/:id/:action', {
        id: '@uuid'
    },
    {
        getUserProfile: {
            method: "GET",
            params: {
                action: "profile"
            }
        },
        get: {
            method: 'GET',
            params: {
                id: 'me'
            }
        },
        getAll : {
            method: 'GET',
            isArray : true,
            params : {
                action : 'all'
            }
        },
        sendVerification : {
            method : 'POST',
            params : {
                action : 'send-verification'
            }
        },
        forgotPassword : {
            method : 'POST',
            params : {
                action : 'forgot-password'
            }
        },
        resetPassword : {
            method : 'POST',
            params : {
                action : 'reset-password'
            }
        },
        getResetPasswordToken : {
            method : 'GET',
            params : {
                action : 'reset-password'
            }
        },
        buyPlan: {
            method: "POST",
            params: {
                action: 'buy-plan'
            }
        },
        getCurrentStipeCustomer: {
            method: "GET",
            params: {
                action: "get-current-stripe-customer"
            }
        },
        adminUpdate: {
            method: "PUT",
            params: {
                action: "admin-update"
            }
        },
        delete: {
            method:'DELETE'
        },
        changePassword: {
            method: 'PUT', 
            params: {
                id: 'id', 
                action: 'password'
            }
        },
        changeEmail: { 
            method: 'PUT', 
            params: {id: 'id', action: 'email'}
        },
        changeProfile: { 
            method: 'PUT', 
            params: {id: 'id', action: 'change-profile'}
        },
        createUserWithInviteToken: {
            method: 'POST', 
            params: {action: 'invite-token'}
        }
    });
});