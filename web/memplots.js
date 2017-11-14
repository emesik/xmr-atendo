var timelineSpan;
var histogramSpan;
var colors = ['#ff6600', '#4c4c4c', '#0062a3'];
var labelWidth = 48;
var resizableParams = {
  minWidth: 300,
  maxWidth: 1200,
  minHeight: 300,
  maxHeight: 400
};
var tooltip;

function drawTimeline(el, graphs, options) {
  var tooltipTimeout = null;

  el.parent().resizable(resizableParams);
  el.bind('plothover', function onPlotHover(evt, pos, item) {
    var date;
    var tstamp;
    var vals = [];
    var yaxis;
    var gr;
    var dat;
    var val;
    var xpos;

    for (var i = 0; i < graphs.length; i++) {
      gr = graphs[i];
      dat = gr.dataset.data;
      yaxis = options.yaxes[(gr.yaxis || 1) - 1];
      val = null;
      for (var j = 0; j < dat.length; j++) {
        if (dat[j][0] >= pos.x) {
          tstamp = tstamp || dat[j][0];
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
    if (tstamp) {
      date = new Date(tstamp).toUTCString();
      xpos = $(document).width() - pos.pageX > 150 ? pos.pageX + 5 : pos.pageX - 200;
      tooltip.html('<span class="value">' + vals.join('/') + '</span><span class="date">' + date + '</span>')
        .css({
          top: pos.pageY - 65,
          left: xpos
        });
      if (tooltipTimeout) clearTimeout(tooltipTimeout);
      tooltip.show();
      tooltipTimeout = setTimeout(function() { tooltip.hide(); }, 2000);
    } else {
      tooltip.hide();
    }
  });

  plotLoop();

  $('#timeline-span input[name="timeline-span"]').bind('change', function onTimespanChange() {
    var tsp = getTimelineSpan($(this).val());
    timelineSpan = tsp[0];
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
        gr.dataset.data = _.dropWhile(gr.dataset.data, function inSpan(item) { return item[0] < now - timelineSpan; });
        options.xaxis.minTickSize[0] = timelineSpan / (1000 * 60 * 60) / ($(document).width() > 500 ? 6 : 4);
        datasets.push(gr.dataset);
      });
      datasets.sort(cmpIndex);
      el.plot(datasets, options);
    });
  }
}

function drawHistogram(rootUrl, dataName, tooltipFormatter) {
  var el = $('#' + dataName);
  var options = {
    xaxis: {
      ticks: genPo2,
      tickFormatter: function toInt(v) { return v.toFixed(0); }
    },
    yaxis: {
      ticks: genPo2,
      transform: function safeLog(v) { return v == 0 ? 0 : (Math.log2(v) + 1); },
      labelWidth: labelWidth,
      reserveSpace: true
    },
    grid: {
      hoverable: true
    }
  };
  el.parent().resizable(resizableParams);
  el.bind('plothover', function onPlotHover(evt, pos, item) {
    var xpos;
    if (!item) {
      tooltip.hide();
      return;
    }
    xpos = $(document).width() - item.pageX > 100 ? item.pageX + 5 : item.pageX - 150;
    tooltip.html('<span class="value">' + tooltipFormatter(item.datapoint) + '</span>')
      .css({
        top: item.pageY - 55,
        left: xpos
      });
    tooltip.show();
  });

  plotLoop();

  $('#histogram-span input[name="histogram-span"]').bind('change', function onHistorgramChange() {
    histogramSpan = getHistogramSpan($(this).val());
    fetchAndPlot();
  });

  function plotLoop() {
    fetchAndPlot();
    setTimeout(plotLoop, 60000);
  }

  function fetchAndPlot() {
    $.ajax({
      url: rootUrl + 'hist-' + dataName + '-' + histogramSpan + '.json',
      success: function onDataRcv(result) {
        el.plot([{
            data: result,
            color: '#0062a3',
            bars: { show: true, lineWidth: 0, align: 'center' }
          }], options);
      }
    });
  }

  function genPo2(axis) {
    var ticks = [];
    var thr = axis.direction == 'x' ? axis.max / $(document).width() * 32 : 0;
    var p = 1;
    if (axis.min < 1) ticks.push(0);
    while (p <= axis.max) {
      if (p > thr) ticks.push(p);
      p = 2 * p;
    }
    return ticks;
  }
}

function drawTimelines(rootUrl) {
  var xAxisOptions = {
    mode: 'time',
    minTickSize: [$(document).width() > 500 ? 2 : 6, 'hour']
  };
  var twoAxisOpts = {
    colors: colors,
    grid: { hoverable: true, autoHighlight: false },
    crosshair: { mode: 'x', color: '#0062a3', lineWidth: 1 },
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
  var tsp = getTimelineSpan();
  timelineSpan = tsp[0];
  $('#timeline-span input[name="timeline-span"][value="' + tsp[1] + '"]').attr('checked', true);

  drawTimeline(
    $('#txns'),
    [ { url: rootUrl + 'timeline-txns.json' } ],
    { colors: colors,
      grid: { hoverable: true, autoHighlight: false },
      crosshair: { mode: 'x', color: '#0062a3', lineWidth: 1 },
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
      grid: { hoverable: true, autoHighlight: false },
      crosshair: { mode: 'x', color: '#0062a3', lineWidth: 1 },
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
}

function drawHistograms(rootUrl) {
  histogramSpan = getHistogramSpan();
  $('#histogram-span input[name="histogram-span"][value="' + histogramSpan + '"]').attr('checked', true);

  drawHistogram(
    rootUrl,
    'inputs',
    function (dpt) {
      return dpt[1] + ' txn' + (dpt[1] == 1 ? '' : 's') +
        ' with ' + dpt[0] + ' input' + (dpt[0] == 1 ? '' : 's');
    }
  );
  drawHistogram(
    rootUrl,
    'outputs',
    function (dpt) {
      return dpt[1] + ' txn' + (dpt[1] == 1 ? '' : 's') +
        ' with ' + dpt[0] + ' output' + (dpt[0] == 1 ? '' : 's');
    }
  );
  drawHistogram(
    rootUrl,
    'ring',
    function (dpt) {
      return dpt[1] + ' txn' + (dpt[1] == 1 ? '' : 's') +
        ' with ' + dpt[0] + ' ring size';
    }
  );
}

function drawPlots(rootUrl) {
  tooltip = $('#tooltip');
  drawTimelines(rootUrl);
  drawHistograms(rootUrl);
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

function getTimelineSpan(val) {
  var result = /^(24|12|4|1)h$/.exec(val);
  var hrs = 4;
  if (result) hrs = parseInt(result[1]) || hrs;
  return [hrs * 60 * 60  * 1000, hrs + 'h'];
}

function getHistogramSpan(val) {
  var result = /^(1w|1d|1h)$/.exec(val);
  if (result) return result[1];
  return '1d';
}
