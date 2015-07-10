'use strict';

angular.module('buiiltApp')
  .factory('Modal', function ($rootScope) {
    /**
     * Opens a modal
     * @param  {Object} scope      - an object to be merged with modal's scope
     * @param  {String} modalClass - (optional) class(es) to be applied to the modal
     * @return {Object}            - the instance $modal.open() returns
     */
    function openModal(text) {
      $rootScope.confirmText = text;
      return $('#confirmModal').openModal();
    };

    function closeModal() {
      return $('#confirmModal').closeModal();
    };

    // Public API here
    return {
      help:{
        shareItLearnMore:function(){
          var deleteModal;
          deleteModal=openModal({
            modal: {
              dismissable: true,
              title: 'Share Avid',
              html:
              '<p>By default an Avid is public. That means that anyone can see it, comment on it or follow it. You can' +
              'invite friends to view and follow your public Avid. Keeping your Avids public is a great way to connect' +
              'with like-minded people on the Internet.</p>' +
              '<p>You can, however, make your Avid private. This means that no one can see it except you, the creator. A' +
              'private Avid will not show up on our home page or any other area of our site. We all have lots of ideas' +
              'and passions but many of them are not for public consumption. We get that. You can, however, invite' +
              'people in to your private Avid. This is useful if you are managing a project that only you and your team' +
              'should see.</p>',
              buttons: [{
                classes: 'btn-default',
                text: 'Cancel',
                click: function(e) {
                  deleteModal.dismiss(e);
                }
              }]
            }
          });
        }
      },
      /* Confirmation modals */

      confirm: function(text,cb) {
        cb = cb || angular.noop;
        var deleteModal;
        openModal(text);
        $rootScope.confirmYes = function() {
          closeModal();
          return cb(true)
        };

        $rootScope.confirmNo = function() {
          closeModal();
          return cb(false)
        };
        /**
         * Open a delete confirmation modal
         * @param  {String} name   - name or info to show on modal
         * @param  {All}           - any additional args are passed staight to del callback
         */
        return function() {
          console.log("asdadadas");
          var args = Array.prototype.slice.call(arguments),
            name = args.shift(),
            deleteModal;



          //deleteModal.result.then(function(event) {
          //  del.apply(event, args);
          //});
        };
      }

    };
});
