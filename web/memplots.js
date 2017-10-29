function drawTimelines(rootUrl, txns, totals, averages, perkbs) {
  var data = {
    txns: [],
    totals: [],
    averages: [],
    perkbs: []
  };
  var plots = {
    txns: null,
    totals: null,
    averages: null,
    perkbs: null
  };

  var colors = ['#ff6600', '#4c4c4c', '#0099ff'];
  var labelWidth = 48;
  var xAxisOptions = {
    mode: 'time',
    minTickSize: [1, "hour"]
  };
  var plotOptions = {
    txns: {
      colors: colors,
      grid: { hoverable: true },
      xaxis: xAxisOptions,
      yaxes: [
        {
          reserveSpace: true,
          labelWidth: labelWidth
        },
        {
          position: 'right',
          reserveSpace: true,
          labelWidth: labelWidth
        }
      ]
    },
    sizesFees: {
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
    },
    perKbs: {
      colors: colors,
      grid: { hoverable: true },
      xaxis: xAxisOptions,
      yaxes: [
        {
          reserveSpace: true,
          labelWidth: labelWidth
        },
        {
          min: 0,
          position: 'right',
          labelWidth: labelWidth,
          reserveSpace: true,
          tickFormatter: mxmrFormatter
        }
      ],
      legend: { position: 'nw' }
    }
  };

  $('<div id="tooltip"></div>').appendTo($('body'));

  [txns, totals, averages, perkbs].forEach(function(e) {
    e.parent().resizable({
      minWidth: 300,
      maxWidth: 1200,
      minHeight: 300,
      maxHeight: 400
    });
    e.bind('plothover', function onPlotHover(evt, pos, item) {
      var date, val;
      if (!item) {
        $('#tooltip').hide();
        return;
      }
      date = new Date(item.datapoint[0]).toUTCString();
      val = item.series.yaxis.tickFormatter(item.datapoint[1], item.series.yaxis);
      $("#tooltip").html('<span class="value">' + val + '</span><span class="date">' + date + '</span>')
        .css({
          top: item.pageY - 55,
          left: item.pageX + 5,
          'border-color': item.series.color
        });
      $('#tooltip').show();
    });
  });

  // txns
  $.ajax({
    url: rootUrl + 'timeline-txns.json',
    success: function(result) {
      data.txns.push(result.data);
      plots.txns = txns.plot(data.txns, plotOptions.txns);
    }
  });

  // totals
  var t1 = $.ajax({
    url: rootUrl + 'timeline-sumsize.json',
    success: function(result) {
      data.totals.push({
        label: 'Mempool size',
        data: result.data,
        index: 10
      });
    }
  });
  var t2 = $.ajax({
    url: rootUrl + 'timeline-sumfee.json',
    success: function(result) {
      data.totals.push({
        label: 'Total fees',
        yaxis: 2,
        data: result.data,
        index: 20
      });
    }
  });
  $.when(t1, t2).done(function() {
    data.totals.sort(cmpIndex);
    plots.totals = totals.plot(data.totals, plotOptions.sizesFees);
  });

  // averages
  var a1 = $.ajax({
    url: rootUrl + 'timeline-avgsize.json',
    success: function(result) {
      data.averages.push({
        label: 'Avg txn size',
        data: result.data,
        index: 10
      });
    }
  });
  var a2 = $.ajax({
    url: rootUrl + 'timeline-avgfee.json',
    success: function(result) {
      data.averages.push({
        label: 'Avg txn fee',
        yaxis: 2,
        data: result.data,
        index: 20,
      });
    }
  });
  $.when(a1, a2).done(function() {
    data.averages.sort(cmpIndex);
    plots.averages = averages.plot(data.averages, plotOptions.sizesFees);
  });

  // per kB
  $.ajax({
    url: rootUrl + 'timeline-avgfeeperkb.json',
    success: function(result) {
      data.perkbs.push({
        label: 'Avg fee per kB',
        yaxis: 2,
        data: result.data,
        index: 10
      });
      plots.perkbs = perkbs.plot(data.perkbs, plotOptions.perKbs);
    }
  });

  setTimeout(function() { drawTimelines(rootUrl, txns, totals, averages, perkbs); }, 120000);

  // functions
  function xmrFormatter(v) {
    if (Math.abs(v) < 0.01) return '0 ɱ';
    return v.toFixed(2) + ' ɱ';
  }

  function mxmrFormatter(v) {
    if (Math.abs(v) < 0.00001) return '0 mɱ';
    return (v * 1000).toFixed(1) + ' mɱ';
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
}
