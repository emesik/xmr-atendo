function drawTimelines(rootUrl, txns, totals, averages) {
  var data = {
    txns: [],
    totals: [],
    averages: []
  };
  var plots = {
    txns: null,
    totals: null,
    averages: null
  };
  var sizeFeeOptions = {
    colors: ['#ff6600', '#0099ff', '#4c4c4c'],
    xaxes: [{
      mode: 'time',
      minTickSize: [1, "hour"]
    }],
    yaxes: [
      {
        min: 0,
        tickFormatter: kBFormatter
      }, {
        min: 0,
        position: 'right',
        alignTickWithAxis: 1,
        tickFormatter: xmrFormatter
      }
    ],
    legend: { position: 'nw' }
  };

  // txns
  $.ajax({
    url: rootUrl + 'timeline-txns.json',
    success: function(result) {
      data.txns.push(result.data);
      plots.txns = txns.plot(data.txns, {
        colors: ['#ff6600', '#0099ff', '#4c4c4c'],
        xaxis: {
          mode: 'time',
          minTickSize: [1, "hour"]
        }
      });
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
    plots.totals = totals.plot(data.totals, sizeFeeOptions);
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
  var a3 = $.ajax({
    url: rootUrl + 'timeline-avgfeeperkb.json',
    success: function(result) {
      data.averages.push({
        label: 'Avg fee per kB',
        yaxis: 2,
        data: result.data,
        index: 30
      });
    }
  });
  $.when(a1, a2, a3).done(function() {
    data.averages.sort(cmpIndex);
    plots.averages = averages.plot(data.averages, sizeFeeOptions);
  });

  // functions
  function xmrFormatter(v) {
    return v.toFixed(2) + ' XMR';
  }

  function kBFormatter(v) {
    var kb = v / 1024.0;
    return kb.toFixed(kb >= 100 ? 0 : 1) + 'kB';
  }

  function cmpIndex(a, b) {
    return (a.index - b.index) || 0;
  }
}
