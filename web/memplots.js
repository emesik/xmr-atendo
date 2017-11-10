var timespan;

function drawTimeline(el, graphs, options) {
  el.parent().resizable({
    minWidth: 300,
    maxWidth: 1200,
    minHeight: 300,
    maxHeight: 400
  });
  el.bind('plothover', function onPlotHover(evt, pos, item) {
    var date;
    var tstamp;
    var vals = [];
    var yaxis;
    var gr;
    var dat;
    var val;
    if (!item) {
      $('#tooltip').hide();
      return;
    }
    tstamp = item.datapoint[0];
    date = new Date(tstamp).toUTCString();
    for (var i = 0; i < graphs.length; i++) {
      gr = graphs[i];
      dat = gr.dataset.data;
      yaxis = options.yaxes[(gr.yaxis || 1) - 1];
      val = null;
      for (var j = 0; j < dat.length; j++) {
        if (dat[j][0] == tstamp) {
          val = dat[j][1];
          break;
        }
      }
      if (val != null) {
        vals.push(yaxis.tickFormatter ? yaxis.tickFormatter(dat[j][1], yaxis) : dat[j][1]);
      } else {
        vals.push('—');
      }
    }
    $("#tooltip").html('<span class="value">' + vals.join('/') + '</span><span class="date">' + date + '</span>')
      .css({
        top: item.pageY - 55,
        left: item.pageX + 5
      });
    $('#tooltip').show();
  });

  plotLoop();

  $('#timespan input[name="timespan"]').bind('change', function onTimespanChange() {
    var tsp = getTimespan($(this).val());
    timespan = tsp[0];
    window.location.hash = '#' + tsp[1];
    fetchAndPlot();
  });

  function plotLoop() {
    fetchAndPlot();
    setTimeout(plotLoop, 60000);
  }

  function fetchAndPlot() {
    var promises = [];
    var p;

    _.forEach(graphs, function(gr) {
      p = $.ajax({
        url: gr.url,
        success: function onDataRcv(result) {
          gr.dataset = {
            label: gr.label,
            index: gr.index,
            yaxis: gr.yaxis,
            data: result.data
          };
        }
      });
      promises.push(p);
    });

    $.when.apply($, promises).done(function onAllDataRcv() {
      var datasets = [];
      var now = new Date();
      _.forEach(graphs, function(gr) {
        gr.dataset.data = _.dropWhile(gr.dataset.data, function inSpan(item) { return item[0] < now - timespan; });
        options.xaxis.minTickSize[0] = timespan / (1000 * 60 * 60) / ($(document).width() > 500 ? 6 : 4);
        datasets.push(gr.dataset);
      });
      datasets.sort(cmpIndex);
      el.plot(datasets, options);
    });
  }
}

function drawTimelines(rootUrl) {
  var colors = ['#ff6600', '#4c4c4c', '#0099ff'];
  var labelWidth = 48;
  var xAxisOptions = {
    mode: 'time',
    minTickSize: [$(document).width() > 500 ? 2 : 6, 'hour']
  };
  var twoAxisOpts = {
    colors: colors,
    grid: { hoverable: true },
    xaxis: xAxisOptions,
    yaxes: [
      {
        min: 0,
        reserveSpace: true,
        labelWidth: labelWidth,
        tickFormatter: kBFormatter
      }, {
        min: 0,
        position: 'right',
        reserveSpace: true,
        labelWidth: labelWidth,
        tickFormatter: xmrFormatter
      }
    ],
    legend: { position: 'nw' }
  };
  var tsp = getTimespan(window.location.hash);
  timespan = tsp[0];
  $('#timespan input[name="timespan"][value="' + tsp[1] + '"]').attr('checked', true);

  drawTimeline(
    $('#txns'),
    [ { url: rootUrl + 'timeline-txns.json' } ],
    { colors: colors,
      grid: { hoverable: true },
      xaxis: xAxisOptions,
      yaxes: [
        { reserveSpace: true,
          labelWidth: labelWidth },
        { position: 'right',
          reserveSpace: true,
          labelWidth: labelWidth }]});

  drawTimeline(
    $('#totals'),
    [ { url: rootUrl + 'timeline-sumsize.json',
        label: 'Mempool size',
        index: 10 },
      { url: rootUrl + 'timeline-sumfee.json',
        label: 'Total fees',
        yaxis: 2,
        index: 20 } ],
    twoAxisOpts);

  drawTimeline(
    $('#averages'),
    [ { url: rootUrl + 'timeline-avgsize.json',
        label: 'Avg txn size',
        index: 10 },
      { url: rootUrl + 'timeline-avgfee.json',
        label: 'Avg txn fee',
        yaxis: 2,
        index: 20 } ],
    twoAxisOpts);

  drawTimeline(
    $('#perkb'),
    [ { url: rootUrl + 'timeline-avgfeeperkb.json',
        label: 'Avg fee per kB',
        yaxis: 2,
        index: 10 }],
    { colors: colors,
      grid: { hoverable: true },
      xaxis: xAxisOptions,
      yaxes: [ {
          reserveSpace: true,
          labelWidth: labelWidth },
        { min: 0,
          position: 'right',
          labelWidth: labelWidth,
          reserveSpace: true,
          tickFormatter: xmrFormatter }],
      legend: { position: 'nw' }});

  $('<div id="tooltip"></div>').appendTo($('body'));
}

// functions
function xmrFormatter(v) {
  if (Math.abs(v) < 0.000000000001) return '0 ɱ';
  if (Math.abs(v) < 0.01) {
    if (Math.abs(v) < 0.001) {
      if (Math.abs(v) < 0.000001) {
        if (Math.abs(v) < 0.000000001) {
          return (v * 1000000000000).toFixed(1) + ' pɱ';
        }
        return (v * 1000000000).toFixed(1) + ' nɱ';
      }
      return (v * 1000000).toFixed(1) + ' µɱ';
    }
    return (v * 1000).toFixed(1) + ' mɱ';
  }
  return v.toFixed(2) + ' ɱ';
}

function kBFormatter(v) {
  var kb = v / 1024.0;
  if (Math.abs(v) < 0.1) return '0 kB';
  if (kb > 1024) return (kb / 1024.0).toFixed(1) + ' MB';
  return kb.toFixed(kb >= 100 ? 0 : 1) + ' kB';
}

function cmpIndex(a, b) {
  return (a.index - b.index) || 0;
}

function getTimespan(val) {
  var result = /^#?(24|12|4|1)h$/.exec(val);
  var hrs = 12;
  if (result) hrs = parseInt(result[1]) || hrs;
  return [hrs * 60 * 60  * 1000, hrs + 'h'];
}
