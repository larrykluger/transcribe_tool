
// This JavaScript is entended to work with all supported
// browsers. Some polyfills may be needed.
//
// See https://getbootstrap.com/docs/4.0/getting-started/browsers-devices/
// for the supported browser list

let TT = (function(){
  // globals
  //
  // NotifyJS -- see https://notifyjs.jpillora.com/
  const notify_info_t = { className:"info", globalPosition: "top center" }
      , notify_warning_t = { className:"warn", globalPosition: "top center" }
      ;
  let library = {}
    , transcript_reader = new FileReader()
    , transcript // the json for the AWS transcript
    , transcript_name
    , audio_reader = new FileReader()
    , audio_name
    , audio_player
    , tt = false // tt == the_transcript. Our format transcript
    ;

/**
 * Format for the tt
 *  tt == Object:
 *    t_items: Array of t_item  -- the items that make up the transcript
 *    speakers: Array of string corresponding to speaker0, speaker1, etc
 *
 * t_item == Object:
 *  start: string for time when the item starts in the file
 *  end: string for time when the item ends in the file
 *  orig: The original transcription from AWS in <div> set
 *  transcription: current version. May have multiple <div> sets if
 *     edited and new lines were entered
 *  speaker: integer
 *  highlight: boolean -- the should the contents be highlighted
 */


  // Add on_click handlers to elements with data-busy attribute
  function augment_busy(){
    $('a[data-busy="href"]').click(busy_href);
  }

  // Process flash messages from the server
  function process_server_flash_msgs(){
    let flash_msg_raw = $("#server_data").attr("data-server-data")
      , flash_msg_json = flash_msg_raw ? JSON.parse(flash_msg_raw) : false
      , flash_msg_info = (flash_msg_json && flash_msg_json.flash &&
          flash_msg_json.flash.info)
      ;
    _.forEach(flash_msg_info, function (msg){
      $.notify(msg, notify_info_t);
    })
  }

  // Handles clicks for elements with attribute data-busy="href"
  // 1. Make global feedback and busy indicators visible
  // 2. Change location to the element's href value
  let busy_href = function _busy_href(e){
    e.preventDefault();
    $("#feedback,#busy").show();
    $("#content").hide();
    const href = $(e.target).attr("href");
    window.location = href;
  }

  let start_up = function(){
    augment_busy();
    process_server_flash_msgs();
    check_file_API();
    add_event_listeners();
  }

  /**
   * See https://www.html5rocks.com/en/tutorials/file/dndfiles/
   */
  function check_file_API() {
    // Check for the various File API support.
    if (window.File && window.FileReader && window.FileList && window.Blob) {
      // Great success! All the File APIs are supported.
    } else {
      alert(`The File APIs are not fully supported in this browser.
Please switch to Google Chrome.`);
    }
  }

  /**
   *  Show the transcript
   */
  function process_transcript(){
    let job = transcript.jobName;
    notify_info(`Processing ${job}` );

    // 1. Process into our format: array of chunks. Each chunk has a speaker,
    //    start / end times of the chunk; bold flag; and the chunk, including <div> elements.
    // 2. Display our format.
    process_into_our_format();
    display_transcript();
  }
  function process_into_our_format(){
    let results = transcript.results
     , speaker_labels = results.speaker_labels
     , speakers = speaker_labels.speakers
     , segments = speaker_labels.segments
     , main_items = results.items
     , main_items_current_i = 0 // The current member of the main items
     ;
    tt = {t_items: [], speakers: []};
    for (let i = 0; i < results.speaker_labels.speakers; i++) {
     tt.speakers[i]=`Speaker&nbsp;${i+1}`
    }

    // Process segments
    segments.forEach((segment, segment_i) => {
     // Process a segment
     if (segment.items.length === 0){return} // Nothing to do

     let t_item = {};
     // eg spk_0
     t_item.speaker = parseInt(segment.speaker_label.split("_")[1]);
     t_item.start = segment.start_time;
     t_item.end = segment.end_time;
     t_item.transcript = "<div>";
     t_item.highlight = false;
     t_item.start_display = hhmmss(t_item.start);
     t_item.end_display = hhmmss(t_item.end);



     segment.items.forEach((item, item_i) => {
       // Find the matching item from the top level items
       let current_main_item = main_items[main_items_current_i];
       if (current_main_item.type === "pronunciation" &&
           current_main_item.start_time === item.start_time &&
           current_main_item.end_time === item.end_time) {
         t_item.transcript += (' ' + current_main_item.alternatives[0].content);

         main_items_current_i += 1; // move to the next one
         current_main_item = main_items[main_items_current_i];
         // Loop until the next item is also pronunciation
         while (current_main_item && current_main_item.type === "punctuation") {
           t_item.transcript += current_main_item.alternatives[0].content;
           main_items_current_i += 1; // move to the next one
           current_main_item = main_items[main_items_current_i];
         }
       } else {
         // Current item doesn't match!
         console.log(`Current main item is ${main_items_current_i}
    Current segment index ${segment_i} item index ${item_i}`);
       }
     })

     // End of the segment. Close the transcript
     t_item.transcript += "</div>";

     // Check the prior tt item. If it was the same speaker then munge it
     let last_t_item = tt.t_items.length > 0 ? tt.t_items[tt.t_items.length - 1] : false;
     if (last_t_item && last_t_item.speaker === t_item.speaker) {
       // Munge the current into the last
       last_t_item.end = t_item.end;
       last_t_item.end_display = hhmmss(t_item.end);
       last_t_item.transcript += t_item.transcript;
     } else {
       tt.t_items.push(t_item);
     }
   })
  }

  function display_transcript(){
    let out = []
      , speakers = tt.speakers
      , template = $("#tableTemplate").html();
    Mustache.parse(template);

    tt.t_items.forEach(item => {
      item.s = speakers[item.speaker];
      out.push(Mustache.render(template, item));
    })
    $("#tableBody").html(out.join());
    // Enable the tooltips
    $('[data-toggle="tooltip"]').tooltip();
  }


  /**
   * Adding Event listeners
   */
  function add_event_listeners() {
    // Setup the dnd listeners.
    $('body').on('dragover' , null, null, handleDragOver)
             .on('drop'     , null, null, handleFileSelect)
             .on('dragenter', null, null, handleDragEnter)
             .on('dragleave', null, null, handleDragLeave)
    $('#tfile').on('change', null, null, handleFileSelect)
  }

  function handleFileSelect(evt) {
    let files = evt.target.files // FileList object
      , file = files[0] // Only one file for this app!
      ;
    // Process json transcript file.
    if (file.type.match('application/json')) {
      transcript_name = file.name;
      const load_complete = (e) => {
        try {transcript = JSON.parse(transcript_reader.result)}
        catch(error) {
          console.error(error);
          notify_warning(error);
        }
        // Check that the JSON is as expected
        if (transcript.jobName && transcript.results) {
          process_transcript()
        } else {
          let msg = "Bad format: not a transcript file?!";
          console.error(msg);
          notify_warning(msg);
        }
      }

      transcript_reader.onload = load_complete;
      // Read in the json file.
      transcript_reader.readAsText(file);
    } else if (file.type.match('audio/mp3')) {
      audio_name = file.name;
      $("#audio-label").text(audio_name);
      notify_info("Loading audio file...");
      audio_reader.onload = process_audio;
      audio_reader.readAsDataURL(file);
    } else {
      notify_warning(`Unexpected file type: ${file.type}`);
    }
  }

  function process_audio(){
    if (!audio_player) {
      audio_player = new MediaElement('player', {
        stretching: 'responsive',
        success: function(mediaEl, originalNode) {
          mediaEl.addEventListener('canplay',
            (e) => {
              notify_info("Audio file loaded.")}, true);
          mediaEl.src = audio_reader.result;
          mediaEl.load();
        }
      })
    } else {
      audio_player.pause();
      audio_player.src = audio_reader.result;
      audio_player.load();
    }
  }

  function handleDragOver(evt) {
    evt.stopPropagation();
    evt.preventDefault();
    evt.dataTransfer.dropEffect = 'copy'; // Explicitly show this is a copy.
  }

  function handleDragEnter(evt) {
    $('body').addClass('dndTarget');
  }

  function handleDragLeave(evt) {
    $('body').removeClass('dndTarget');
  }




  // See http://jsfiddle.net/unLSJ/
  // USAGE: $(el).html(library.json.prettyPrint(json_obj));
  // where el is <pre><code> el
  // or
  // $(el).html(library.json.prettyPrint2(json_obj));
  // where el is any el (<pre><code> will be added)
  library.json = {
   replacer: function(match, pIndent, pKey, pVal, pEnd) {
      var key = '<span class=json-key>';
      var val = '<span class=json-value>';
      var str = '<span class=json-string>';
      var r = pIndent || '';
      if (pKey)
         r = r + key + pKey.replace(/[": ]/g, '') + '</span>: ';
      if (pVal)
         r = r + (pVal[0] == '"' ? str : val) + pVal + '</span>';
      return r + (pEnd || '');
      },
   prettyPrint: function(obj) {
      var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg;
      return JSON.stringify(obj, null, 3)
         .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
         .replace(/</g, '&lt;').replace(/>/g, '&gt;')
         .replace(jsonLine, library.json.replacer);
      },
   prettyPrint2: function(obj) {
       var jsonLine = /^( *)("[\w]+": )?("[^"]*"|[\w.+-]*)?([,[{])?$/mg
         , out = JSON.stringify(obj, null, 3)
          .replace(/&/g, '&amp;').replace(/\\"/g, '&quot;')
          .replace(/</g, '&lt;').replace(/>/g, '&gt;')
          .replace(jsonLine, library.json.replacer);
       return '<pre><code>' + out + '</code></pre>';
      }
   };

   function notify_info (msg) {
     $.notify(msg, notify_info_t);
   }
   function notify_warning (msg) {
     $.notify(msg, notify_warning_t);
   }

   function pad(num) {
       return ("0"+num).slice(-2);
   }
   function hhmmss(secs) {
     secs = Math.round(secs);
     var minutes = Math.floor(secs / 60);
     secs = secs%60;
     var hours = Math.floor(minutes/60)
     minutes = minutes%60;
     return pad(hours)+":"+pad(minutes)+":"+pad(secs);
   }
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////////

// Return the publicly exposed items
  return {
    start_up: start_up
  }
})();


// Main stem
$( document ).ready(function() {
  TT.start_up();
});
