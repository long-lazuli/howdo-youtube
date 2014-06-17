var application = {
    options: {
        debug: true,
        dim_videoplayer_onSearch: [ 'video-list-search' ],
        empty_search_onStart: false,
        show_player_on_play: true
    },
    flags: {
      // 0 is not loadable
      // 1 is loadable
      // 2 is initialised
      playerLoaded: 0
    },
    pagination: {},
    searchCache: {},
    player: false,
    
    // The main function :
    init: function(){
      var app = this;
      app._log('Initialisation.');
 
      document.getElementById('search-button').disabled = false;
 
    },

    // 'Private' methods will begin by a _    
    _log: function(msg){
        if(this.options.debug){
          console.log(msg);
        }
    },

    search: function( extraParams, videoList ) {
      var app = this;
   
      var q = document.getElementById('query').value;
      videoList = videoList || 'video-list-search';
      extraParams = extraParams || {};
      var params = app._mergeTo(
                  extraParams,
                  {
                    q: q,
                    part: 'snippet'
                  });

      var searchKey = encodeURIComponent(JSON.stringify(params));


      if( !(searchKey in app.searchCache) ){
        app._log(JSON.stringify(params) + ' is not cached.');

        var request = gapi.client.youtube.search.list(params);
        request.execute( function(response){

          if(response.result){
            app._addToSearchList(q, searchKey);
            app.searchCache[searchKey] = response.result;
            app._handleSearchResult( app.searchCache[searchKey], videoList);
          }

        });

      }else{
        app._log(JSON.stringify(params) + ' is cached.');
        app._handleSearchResult( app.searchCache[searchKey], videoList);
      }


    },

    retrieveSearch: function(el){
      var app = this,
          searchEl = el.parentNode,
          searchQuery = (el.innerHTML == '[empty]')? '': el.innerHTML,
          searchKey = searchEl.getAttribute('itemId');

      document.getElementById('query').value = searchQuery;
      app._handleSearchResult(app.searchCache[searchKey], 'video-list-search');
    },

    _handleSearchResult: function(result, videoList){
      var app = this;
      if(result){

        if(app.options.dim_videoplayer_onSearch.indexOf(videoList) >= 0){
          document.getElementById('hide-video-frame').checked = true;
        }

        app._changePagingButton(
          (result.prevPageToken || false),
          (result.nextPageToken || false),
          videoList
        );

        if(result.items){

          var videos = result.items;
          app._resetVideoList( "", videoList );

          for (var index in videos) {
            app._addToVideoList(videos[index], videoList );
          }

        }else{
          app._resetVideoList('No results. Make another search.', videoList);
        }
      }

    },

    play: function(el){
      var app = this,
          video = el.parentNode.parentNode,
          videoId = video.getAttribute('itemid');

      if(app.options.show_player_on_play)
        document.getElementById('hide-video-frame').checked = false;
      app.player.loadVideoById(videoId);
    },

    pause: function(el){
      var app = this;
      app.player.pauseVideo();
    },

    stop: function(){
      var app = this;
      app.player.stopVideo();
    },

    next: function(el){
      var app = this;
      app.player.nextVideo();
    },

    previous: function(el){
      var app = this;
      app.player.previousVideo();
    },

    playVideoAt: function(index){
      var app = this;
      app.player.playVideoAt(index);
    },

    setLoop: function(loopPlaylists){
      var app = this;
      app.player.setLoop(loopPlaylists);
    },
    setShuffle: function(shufflePlaylist){
      var app = this;
      app.player.setLoop(shufflePlaylist);
    },

    getVideoLoadedFraction: function(index){
      var app = this;
      app.player.getVideoLoadedFraction();
    },

    enqueue: function(el){
      var app = this,
          video = el.parentNode,
          videoId = video.getAttribute('itemid');
      app.player.cueVideoById(videoId);
    },


    _changePagingButton: function(prev, next, videoList){
      var app = this,
          nextPageButton = document.getElementById(videoList).querySelector('.next-button'),
          prevPageButton = document.getElementById(videoList).querySelector('.prev-button');

      app.pagination[videoList] = [];
      app.pagination[videoList].prevPage = prev || false;
      app.pagination[videoList].nextPage = next || false;

      if(next){
        nextPageButton.removeAttribute('disabled');
      }else{
        nextPageButton.setAttribute('disabled', true);
      }

      if(prev){
        prevPageButton.removeAttribute('disabled');
      }else{
        prevPageButton.setAttribute('disabled', true);
      }

    },


    _resetVideoList: function(msg, videoList){
      msg = msg || '';
      document.getElementById(videoList).querySelector('.video-list').innerHTML = msg;
    },

    _addToVideoList: function(video, videoList){
      var app = this;
      var node = document.getElementById(videoList).querySelector('.video-tpl').content.cloneNode(true);

      // TODO: make that code fancy:
      node.querySelector('[itemprop=video]').setAttribute('itemid', video.id.videoId);

      node.querySelector('[itemprop=name]').innerHTML = video.snippet.title;
      node.querySelector('[itemprop=description]').innerHTML = video.snippet.description;
      node.querySelector('img').src = video.snippet.thumbnails.default.url;
      node.querySelector('[itemprop=embedURL]').setAttribute('content', "http://www.youtube.com/watch?v=" + video.id.videoId);
      node.querySelector('[itemprop=thumbnailURL]').setAttribute('content', video.snippet.thumbnails.default.url);

      document.getElementById(videoList).querySelector('.video-list').appendChild(node);
    },

    _addToSearchList: function(query, searchKey){
      var app = this;
      var searchList = document.getElementById('search-list-recent');
      var node = searchList.querySelector('.search-tpl').content.cloneNode(true);
      query = (query === '')? "[empty]": query;

      // TODO: make that code fancy:
      node.querySelector('[itemprop=search]').setAttribute('itemid', searchKey);
      node.querySelector('[itemprop=name]').innerHTML = query;
      node.querySelector('[itemprop=name]').setAttribute('alt', searchKey );

      searchList.querySelector('.search-list').appendChild(node);
    },

    _mergeTo: function(getObject, toObject){

      for (var attrName in getObject) {
        toObject[attrName] = getObject[attrName];
      }
      return toObject;
    },

    prevPage: function(videoList) {
      var app = this;
      if(app.pagination[videoList].prevPage)
        app.search({pageToken: app.pagination[videoList].prevPage }, videoList);
    },
    nextPage: function(videoList) {
      var app = this;
      if(app.pagination[videoList].nextPage)
        app.search({pageToken: app.pagination[videoList].nextPage }, videoList);
    },

    onPlayerAPIReady: function(){
      var app = this;
      app.flags.playerLoaded = 1;
      application.player = new YT.Player('video-frame', {
        events: {
            'onReady': app.onPlayerReady,
            'onStateChange': app.onPlayerStateChange,
            'onError': app.onPlayerError
          }
      });
    },


    onPlayerReady: function(event){
      var app = this,
          player = document.getElementById('video-player');
      app.flags.playerLoaded = 2;
      player.classList.add('active');
      event.target.playVideo();
    },
    onPlayerStateChange: function(event) {
      var app = this;
      document.getElementById('video-player').setAttribute('data-state', event.data);

    },
    onPlayerError: function(event){
      console.warn(event);
    },

    onPlayerPlay: function(event){
      playerTitle.innerHTML = videoTitle.innerHTML;
      app.search({relatedToVideoId: videoId, q: '', type: 'video'}, 'video-list-related');

    }
    
};

var setGoogleAPIKey = function(){
  console.log('setGoogleAPIKey');
  var app = application;
  gapi.client.setApiKey("AIzaSyCHsiSAYtC01v6LqK0OWLGaVDHj9_K46ho");
  gapi.client.load('youtube', 'v3', function(){
    //Add function here if some action required immediately after the API loads
    app._log('ready to search vidz !');
    application.init();
  });
};


// YouTube player after the API code downloads.
function onYouTubePlayerAPIReady() {
  console.log('onYoutubePlayerAPIReady');
  application.onPlayerAPIReady();
}
